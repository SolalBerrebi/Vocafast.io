import SwiftUI
import UniformTypeIdentifiers

struct DecksView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DecksViewModel()
    @State private var showNewDeck = false
    @State private var quickTrainDeckId: UUID?
    @State private var showQuickTrain = false
    @State private var deletingDeckId: UUID?
    @State private var showDeleteDeck = false
    @State private var addWordsDeckId: UUID?
    @State private var showAddWords = false
    @State private var showImportPicker = false
    @State private var importBanner: String?

    var body: some View {
        ZStack {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.decks.isEmpty {
                // Empty state
                VStack(spacing: 16) {
                    Text("📚")
                        .font(.system(size: 64))
                    Text(L("decks_empty_title"))
                        .font(.title2.bold())
                    Text(L("decks_empty_subtitle"))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 40)
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.decks) { deck in
                            NavigationLink(value: deck.id) {
                                DeckCardView(deck: deck)
                            }
                            .contextMenu {
                                if deck.wordCount > 0 {
                                    Button {
                                        quickTrainDeckId = deck.id
                                        showQuickTrain = true
                                    } label: {
                                        Label(L("decks_train"), systemImage: "play.fill")
                                    }
                                }

                                Button(role: .destructive) {
                                    deletingDeckId = deck.id
                                    showDeleteDeck = true
                                } label: {
                                    Label(L("decks_delete_deck"), systemImage: "trash")
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
            }

            // FAB Menu
            VStack {
                // Import success banner
                if let banner = importBanner {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(banner)
                            .font(.subheadline.weight(.medium))
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                Spacer()
                HStack {
                    Spacer()
                    Menu {
                        Button {
                            showNewDeck = true
                        } label: {
                            Label(L("decks_new_deck"), systemImage: "plus.rectangle")
                        }

                        Button {
                            showImportPicker = true
                        } label: {
                            Label(L("decks_import_file"), systemImage: "square.and.arrow.down")
                        }
                    } label: {
                        Image(systemName: "plus")
                            .font(.title2.bold())
                            .foregroundStyle(.white)
                            .frame(width: 56, height: 56)
                            .background(Color.accentColor)
                            .clipShape(Circle())
                            .shadow(color: Color.accentColor.opacity(0.3), radius: 8, y: 4)
                    }
                    .padding(.trailing, 20)
                    .padding(.bottom, 20)
                }
            }

            // Coach mark
            if viewModel.showCoachMark {
                VStack {
                    Spacer().frame(height: 80)
                    CoachMarkView(text: L("decks_coach_mark")) {
                        withAnimation {
                            viewModel.showCoachMark = false
                            CoachMarkStore.dismiss("decks_tap")
                        }
                    }
                    Spacer()
                }
            }
        }
        .navigationTitle(L("decks_title"))
        .navigationDestination(isPresented: $showNewDeck) {
            NewDeckView { deckId in
                addWordsDeckId = deckId
                // Refresh deck list, then navigate to AddWordsView
                Task {
                    await viewModel.fetchDecks(environmentId: appState.activeEnvironmentId)
                    showAddWords = true
                }
            }
        }
        .navigationDestination(isPresented: $showAddWords) {
            if let deckId = addWordsDeckId {
                AddWordsView(deckId: deckId)
            }
        }
        .navigationDestination(for: UUID.self) { deckId in
            DeckDetailView(deckId: deckId)
        }
        .navigationDestination(isPresented: $showQuickTrain) {
            if let deckId = quickTrainDeckId {
                TrainingLauncherView(deckId: deckId)
            }
        }
        .task {
            await viewModel.fetchDecks(environmentId: appState.activeEnvironmentId)
        }
        .onChange(of: appState.activeEnvironmentId) { _, newValue in
            Task {
                await viewModel.fetchDecks(environmentId: newValue)
            }
        }
        .fileImporter(
            isPresented: $showImportPicker,
            allowedContentTypes: [.commaSeparatedText, .tabSeparatedText, .json, .plainText],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                guard url.startAccessingSecurityScopedResource() else { return }
                defer { url.stopAccessingSecurityScopedResource() }
                if let data = try? Data(contentsOf: url) {
                    Task { await importDeck(data: data, fileName: url.lastPathComponent) }
                }
            case .failure:
                break
            }
        }
        .confirmationDialog(
            L("decks_delete_title"),
            isPresented: $showDeleteDeck,
            titleVisibility: .visible
        ) {
            Button(L("common_delete"), role: .destructive) {
                if let id = deletingDeckId {
                    Task { await viewModel.deleteDeck(id: id) }
                }
            }
        } message: {
            Text(L("decks_delete_message"))
        }
    }

    // MARK: - Import Logic

    private func importDeck(data: Data, fileName: String) async {
        let content = String(data: data, encoding: .utf8) ?? ""
        let meta = DeckImporter.parse(fileContent: content, fileName: fileName)

        guard !meta.words.isEmpty else { return }

        let deckRepo = DeckRepository()
        let wordRepo = WordRepository()
        let envRepo = EnvironmentRepository()

        do {
            // Resolve environment
            let envId: UUID
            if let targetLang = meta.targetLang, !targetLang.isEmpty,
               let existing = appState.environments.first(where: { $0.targetLang == targetLang }) {
                envId = existing.id
            } else if let targetLang = meta.targetLang, !targetLang.isEmpty {
                let flag = Config.languageFlag(for: targetLang)
                let newEnv = try await envRepo.create(targetLang: targetLang, color: "#007AFF", icon: flag)
                await appState.fetchEnvironments()
                await appState.switchEnvironment(to: newEnv.id)
                envId = newEnv.id
            } else if let activeId = appState.activeEnvironmentId {
                envId = activeId
            } else {
                return
            }

            let cappedWords = Array(meta.words.prefix(500))
            let resolvedName = meta.deckName ?? fileName.replacingOccurrences(of: "\\.[^.]+$", with: "", options: .regularExpression)

            let deck = try await deckRepo.create(
                environmentId: envId,
                name: resolvedName,
                color: meta.color ?? "#5856D6",
                icon: meta.icon ?? "📥"
            )

            _ = try await wordRepo.addBatch(
                deckId: deck.id,
                words: cappedWords.map { ($0.word, $0.translation, $0.context) },
                sourceType: .manual
            )

            // Refresh list
            await viewModel.fetchDecks(environmentId: appState.activeEnvironmentId)

            // Show banner
            let deckName = resolvedName
            let count = cappedWords.count
            withAnimation {
                importBanner = "\(count) words imported into \(deckName)"
            }
            HapticsManager.success()

            // Auto-dismiss banner after 3s
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            withAnimation {
                importBanner = nil
            }
        } catch {}
    }
}

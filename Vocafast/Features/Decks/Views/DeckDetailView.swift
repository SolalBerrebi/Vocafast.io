import SwiftUI

struct DeckDetailView: View {
    let deckId: UUID
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DeckDetailViewModel()
    @State private var showExportMenu = false
    @State private var exportFileURL: URL?
    @State private var showShareSheet = false
    @State private var showDeleteDeck = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.words.isEmpty {
                // Empty state
                VStack(spacing: 24) {
                    Text(L("deck_detail_empty_title"))
                        .font(.title2.bold())
                    Text(L("deck_detail_empty_subtitle"))
                        .foregroundStyle(.secondary)

                    VStack(spacing: 12) {
                        EmptyMethodCard(icon: "pencil", title: L("deck_detail_manual"), description: L("deck_detail_manual_desc"))
                        EmptyMethodCard(icon: "camera", title: L("deck_detail_photo"), description: L("deck_detail_photo_desc"))
                        EmptyMethodCard(icon: "doc.text", title: L("deck_detail_text"), description: L("deck_detail_text_desc"))
                        EmptyMethodCard(icon: "sparkles", title: L("deck_detail_topics"), description: L("deck_detail_topics_desc"))
                    }

                    NavigationLink {
                        AddWordsView(deckId: deckId)
                    } label: {
                        Text(L("deck_detail_add_words"))
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .foregroundStyle(.white)
                            .background(Color.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 24)
            } else {
                VStack(spacing: 0) {
                    // Search bar
                    if viewModel.showSearchBar {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(.secondary)
                            TextField(L("deck_detail_search"), text: $viewModel.searchText)
                                .autocapitalization(.none)
                        }
                        .padding(10)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                    }

                    // Bulk delete bar
                    if viewModel.isSelectMode {
                        HStack {
                            Button(viewModel.selectedWordIds.count == viewModel.filteredWords.count ? L("deck_detail_deselect_all") : L("deck_detail_select_all")) {
                                if viewModel.selectedWordIds.count == viewModel.filteredWords.count {
                                    viewModel.deselectAll()
                                } else {
                                    viewModel.selectAll()
                                }
                            }
                            Spacer()
                            if !viewModel.selectedWordIds.isEmpty {
                                Button(LF("deck_detail_delete_words", viewModel.selectedWordIds.count)) {
                                    Task { await viewModel.deleteBulk() }
                                }
                                .foregroundStyle(.red)
                                .fontWeight(.semibold)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                    }

                    // Word list
                    List {
                        ForEach(viewModel.filteredWords) { word in
                            if viewModel.isSelectMode {
                                HStack {
                                    Image(systemName: viewModel.selectedWordIds.contains(word.id) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(viewModel.selectedWordIds.contains(word.id) ? Color.accentColor : .secondary)
                                    WordRowView(word: word)
                                }
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    viewModel.toggleSelection(id: word.id)
                                    HapticsManager.selection()
                                }
                            } else {
                                WordRowView(word: word)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        viewModel.editingWord = word
                                    }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
        }
        .navigationTitle(viewModel.deck?.name ?? "Deck")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if viewModel.words.isEmpty && !viewModel.isLoading {
                    Menu {
                        Button(role: .destructive) {
                            showDeleteDeck = true
                        } label: {
                            Label(L("deck_detail_delete_deck"), systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }

                if !viewModel.words.isEmpty {
                    // More menu (select, export)
                    Menu {
                        Button {
                            viewModel.isSelectMode.toggle()
                            if !viewModel.isSelectMode {
                                viewModel.selectedWordIds.removeAll()
                            }
                        } label: {
                            Label(
                                viewModel.isSelectMode ? L("deck_detail_cancel_selection") : L("deck_detail_select_words"),
                                systemImage: viewModel.isSelectMode ? "xmark.circle" : "checkmark.circle"
                            )
                        }

                        Menu(L("deck_detail_export")) {
                            Button(L("deck_detail_export_tsv")) {
                                exportAs(format: .tsv)
                            }
                            Button(L("deck_detail_export_json")) {
                                exportAs(format: .json)
                            }
                        }

                        Divider()

                        Button(role: .destructive) {
                            showDeleteDeck = true
                        } label: {
                            Label(L("deck_detail_delete_deck"), systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }

                    // Add words
                    NavigationLink {
                        AddWordsView(deckId: deckId)
                    } label: {
                        Image(systemName: "plus")
                    }

                    // Train
                    NavigationLink {
                        TrainingLauncherView(deckId: deckId)
                    } label: {
                        Image(systemName: "play.fill")
                    }
                }
            }
        }
        .sheet(item: $viewModel.editingWord) { word in
            EditWordSheet(word: word) { updatedWord, updatedTranslation, updatedContext in
                Task {
                    await viewModel.updateWord(
                        id: word.id,
                        word: updatedWord,
                        translation: updatedTranslation,
                        context: updatedContext
                    )
                }
            } onDelete: {
                Task {
                    await viewModel.deleteWord(id: word.id)
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let url = exportFileURL {
                ShareSheet(items: [url])
            }
        }
        .task {
            await viewModel.fetchDeckAndWords(deckId: deckId)
        }
        .confirmationDialog(
            L("decks_delete_title"),
            isPresented: $showDeleteDeck,
            titleVisibility: .visible
        ) {
            Button(L("common_delete"), role: .destructive) {
                Task {
                    let repo = DeckRepository()
                    try? await repo.delete(id: deckId)
                    dismiss()
                }
            }
        } message: {
            Text(L("decks_delete_message"))
        }
    }

    private enum ExportFormat { case tsv, json }

    private func exportAs(format: ExportFormat) {
        let exportData: DeckExporter.ExportData?
        switch format {
        case .tsv:
            exportData = viewModel.exportTSV()
        case .json:
            exportData = viewModel.exportJSON(targetLang: appState.activeEnvironment?.targetLang ?? "")
        }

        guard let export = exportData else { return }
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(export.fileName)
        try? export.data.write(to: tempURL)
        exportFileURL = tempURL
        showShareSheet = true
    }
}

struct EmptyMethodCard: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .frame(width: 40, height: 40)
                .background(Color.accentColor.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .foregroundStyle(Color.accentColor)

            VStack(alignment: .leading) {
                Text(title).font(.subheadline.bold())
                Text(description).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color(.systemGray6)))
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

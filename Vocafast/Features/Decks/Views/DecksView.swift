import SwiftUI

struct DecksView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DecksViewModel()
    @State private var showNewDeck = false
    @State private var quickTrainDeckId: UUID?
    @State private var showQuickTrain = false
    @State private var deletingDeckId: UUID?
    @State private var showDeleteDeck = false

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

            // FAB
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button {
                        showNewDeck = true
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
            NewDeckView()
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
}

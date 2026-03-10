import SwiftUI

struct DecksView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DecksViewModel()
    @State private var showNewDeck = false

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
                    Text("No decks yet")
                        .font(.title2.bold())
                    Text("Create your first vocabulary deck to start learning")
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
                            .shadow(color: .accentColor.opacity(0.3), radius: 8, y: 4)
                    }
                    .padding(.trailing, 20)
                    .padding(.bottom, 20)
                }
            }

            // Coach mark
            if viewModel.showCoachMark {
                VStack {
                    Spacer().frame(height: 80)
                    CoachMarkView(text: "Tap your deck to get started!") {
                        withAnimation {
                            viewModel.showCoachMark = false
                            CoachMarkStore.dismiss("decks_tap")
                        }
                    }
                    Spacer()
                }
            }
        }
        .navigationTitle("Decks")
        .navigationDestination(isPresented: $showNewDeck) {
            NewDeckView()
        }
        .navigationDestination(for: UUID.self) { deckId in
            DeckDetailView(deckId: deckId)
        }
        .task {
            await viewModel.fetchDecks(environmentId: appState.activeEnvironmentId)
        }
        .onChange(of: appState.activeEnvironmentId) { _, newValue in
            Task {
                await viewModel.fetchDecks(environmentId: newValue)
            }
        }
    }
}

import SwiftUI

@MainActor
final class DecksViewModel: ObservableObject {
    @Published var decks: [Deck] = []
    @Published var isLoading = false
    @Published var showCoachMark = false

    private let deckRepo = DeckRepository()

    func fetchDecks(environmentId: UUID?) async {
        guard let envId = environmentId else {
            decks = []
            return
        }

        isLoading = true
        do {
            decks = try await deckRepo.fetchAll(environmentId: envId)
        } catch {
            decks = []
        }
        isLoading = false

        // Show coach mark on first visit
        if !decks.isEmpty && !CoachMarkStore.isDismissed("decks_tap") {
            showCoachMark = true
        }
    }

    func deleteDeck(id: UUID) async {
        do {
            try await deckRepo.delete(id: id)
            decks.removeAll { $0.id == id }
            HapticsManager.success()
        } catch {
            HapticsManager.error()
        }
    }
}

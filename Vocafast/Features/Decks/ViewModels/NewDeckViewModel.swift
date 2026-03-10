import SwiftUI

@MainActor
final class NewDeckViewModel: ObservableObject {
    @Published var name = ""
    @Published var selectedColor = "#007AFF"
    @Published var selectedIcon = "📚"
    @Published var isLoading = false
    @Published var errorMessage: String?

    let colors = ["#007AFF", "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#5856D6", "#AF52DE", "#FF2D55"]
    let icons = ["📚", "🔤", "✈️", "🍕", "💼", "🏠", "🎵", "🎮", "💪", "🌍"]

    private let deckRepo = DeckRepository()

    func createDeck(environmentId: UUID?) async -> Deck? {
        guard let envId = environmentId else {
            errorMessage = "No active environment."
            return nil
        }
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Please enter a deck name."
            return nil
        }

        isLoading = true
        errorMessage = nil

        do {
            let deck = try await deckRepo.create(
                environmentId: envId,
                name: name.trimmingCharacters(in: .whitespaces),
                color: selectedColor,
                icon: selectedIcon
            )
            HapticsManager.success()
            isLoading = false
            return deck
        } catch {
            errorMessage = error.localizedDescription
            HapticsManager.error()
            isLoading = false
            return nil
        }
    }
}

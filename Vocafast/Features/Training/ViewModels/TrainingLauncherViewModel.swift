import SwiftUI

@MainActor
final class TrainingLauncherViewModel: ObservableObject {
    let deckId: UUID

    @Published var deck: Deck?
    @Published var stats: WordRepository.DeckStats?
    @Published var selectedScope: StudyScope = .smart
    @Published var selectedMode: TrainingMode = .flashcard
    @Published var frontSide: CardFrontSide = .word
    @Published var sessionSize: Int = 10
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let deckRepo = DeckRepository()
    private let wordRepo = WordRepository()
    private let trainingRepo = TrainingRepository()

    let sessionSizes = [5, 10, 15, 20]

    init(deckId: UUID) {
        self.deckId = deckId
    }

    func load() async {
        isLoading = true
        do {
            async let deckFetch = deckRepo.fetch(id: deckId)
            async let statsFetch = wordRepo.fetchDeckStats(deckId: deckId)
            deck = try await deckFetch
            stats = try await statsFetch

            // Auto-select scope
            if let s = stats {
                if s.due > 0 || s.newCount > 0 {
                    selectedScope = .smart
                } else {
                    selectedScope = .all
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func startSession(environmentId: UUID?) async -> (session: TrainingSession, cards: [TrainingCard])? {
        guard let envId = environmentId else {
            errorMessage = "No active environment."
            return nil
        }
        guard let s = stats, s.total > 0 else {
            errorMessage = "This deck has no words."
            return nil
        }

        isLoading = true
        errorMessage = nil

        do {
            // Build queue
            let words = try await SRSScheduler.buildTrainingQueue(
                deckId: deckId,
                scope: selectedScope,
                sessionSize: sessionSize
            )

            guard !words.isEmpty else {
                errorMessage = "No words match the selected scope."
                isLoading = false
                return nil
            }

            // Create session in DB
            let session = try await trainingRepo.createSession(
                environmentId: envId,
                deckId: deckId,
                mode: selectedMode
            )

            // Build training cards
            var cards: [TrainingCard] = []
            for word in words {
                if selectedMode == .multiple_choice {
                    // Generate 3 wrong options from other words
                    let otherTranslations = words
                        .filter { $0.id != word.id }
                        .map(\.translation)
                        .shuffled()
                        .prefix(3)
                    var options = Array(otherTranslations) + [word.translation]
                    options.shuffle()
                    cards.append(TrainingCard(word: word, options: options))
                } else {
                    cards.append(TrainingCard(word: word))
                }
            }

            isLoading = false
            return (session, cards)
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return nil
        }
    }
}

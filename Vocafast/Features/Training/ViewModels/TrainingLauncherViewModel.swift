import SwiftUI
import SwiftData

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
    @Published var isOfflineSession = false

    private let deckRepo = DeckRepository()
    private let wordRepo = WordRepository()
    private let trainingRepo = TrainingRepository()

    let sessionSizes = [5, 10, 15, 20, 0]  // 0 = infinite (all words)

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

    func startSession(environmentId: UUID?, modelContext: ModelContext) async -> (session: TrainingSession, cards: [TrainingCard])? {
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
        isOfflineSession = false

        let effectiveSize = sessionSize == 0 ? 999 : sessionSize

        // Try online first, fall back to offline cache
        var words: [Word] = []

        do {
            words = try await SRSScheduler.buildTrainingQueue(
                deckId: deckId,
                scope: selectedScope,
                sessionSize: effectiveSize
            )
        } catch {
            // Network failed — try offline cache
            let offlineWords = OfflineDeckManager.shared.buildOfflineQueue(
                deckId: deckId,
                scope: selectedScope,
                sessionSize: effectiveSize,
                context: modelContext
            )
            if !offlineWords.isEmpty {
                words = offlineWords
                isOfflineSession = true
            } else {
                errorMessage = "No internet connection and this deck is not downloaded for offline use."
                isLoading = false
                return nil
            }
        }

        guard !words.isEmpty else {
            errorMessage = "No words match the selected scope."
            isLoading = false
            return nil
        }

        // Create session in DB (or generate a local ID if offline)
        let session: TrainingSession
        do {
            session = try await trainingRepo.createSession(
                environmentId: envId,
                deckId: deckId,
                mode: selectedMode
            )
        } catch {
            // Offline — create local session
            session = TrainingSession(
                id: UUID(),
                environmentId: envId,
                deckId: deckId,
                mode: selectedMode,
                correct: 0,
                incorrect: 0,
                startedAt: Date().iso8601String,
                finishedAt: nil,
                durationSeconds: 0,
                avgResponseTimeMs: 0,
                xpEarned: 0
            )
            isOfflineSession = true
        }

        // Build training cards
        var cards: [TrainingCard] = []
        for word in words {
            if selectedMode == .multiple_choice {
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
    }
}

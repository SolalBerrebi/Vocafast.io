import SwiftUI

@MainActor
final class ProgressViewModel: ObservableObject {
    @Published var totalWords = 0
    @Published var masteredWords = 0
    @Published var totalSessions = 0
    @Published var accuracy: Double = 0
    @Published var sessionDates: Set<String> = []
    @Published var isLoading = false

    private let deckRepo = DeckRepository()
    private let wordRepo = WordRepository()
    private let trainingRepo = TrainingRepository()

    func load(environmentId: UUID?) async {
        guard let envId = environmentId else { return }

        isLoading = true

        do {
            // Fetch deck summaries
            let summaries = try await deckRepo.fetchSummaries(environmentId: envId)
            totalWords = summaries.reduce(0) { $0 + $1.wordCount }

            // Count mastered
            let deckIds = summaries.map(\.id)
            if !deckIds.isEmpty {
                masteredWords = try await wordRepo.countMastered(deckIds: deckIds)
            }

            // Fetch completed sessions
            let sessions = try await trainingRepo.fetchCompletedSessions(environmentId: envId)
            totalSessions = sessions.count

            let totalCorrect = sessions.reduce(0) { $0 + $1.correct }
            let totalIncorrect = sessions.reduce(0) { $0 + $1.incorrect }
            let totalAnswers = totalCorrect + totalIncorrect
            accuracy = totalAnswers > 0 ? Double(totalCorrect) / Double(totalAnswers) * 100 : 0

            // Extract session dates
            sessionDates = Set(sessions.compactMap { session in
                if let date = Date.fromISO(session.startedAt) {
                    return date.yyyyMMdd
                }
                return nil
            })
        } catch {
            // Silently fail
        }

        isLoading = false
    }
}

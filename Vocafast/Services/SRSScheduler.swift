import Foundation

enum SRSScheduler {
    private static let wordRepo = WordRepository()

    static func buildTrainingQueue(deckId: UUID, scope: StudyScope, sessionSize: Int = 20) async throws -> [Word] {
        var queue: [Word]

        switch scope {
        case .all:
            queue = try await wordRepo.fetchAllLimited(deckId: deckId, limit: sessionSize)
            queue.shuffle()
        case .mistakes:
            queue = try await wordRepo.fetchMistakes(deckId: deckId, limit: sessionSize)
            queue.shuffle()
        case .newOnly:
            queue = try await wordRepo.fetchNew(deckId: deckId, limit: sessionSize)
            queue.shuffle()
        case .smart:
            let due = try await wordRepo.fetchDue(deckId: deckId, limit: sessionSize)
            queue = due
            let remaining = sessionSize - due.count
            if remaining > 0 {
                let newWords = try await wordRepo.fetchNew(deckId: deckId, limit: remaining)
                queue.append(contentsOf: newWords)
            }
            queue.shuffle()
        }

        return queue
    }
}

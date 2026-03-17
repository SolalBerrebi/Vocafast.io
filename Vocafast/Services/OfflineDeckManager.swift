import Foundation
import SwiftData
import SwiftUI

@MainActor
final class OfflineDeckManager: ObservableObject {
    static let shared = OfflineDeckManager()

    private let wordRepo = WordRepository()
    private let trainingRepo = TrainingRepository()

    @Published var downloadingDeckIds: Set<UUID> = []

    // MARK: - Download Deck

    func downloadDeck(deckId: UUID, deck: Deck, context: ModelContext) async {
        downloadingDeckIds.insert(deckId)
        defer { downloadingDeckIds.remove(deckId) }

        do {
            // Fetch all words from Supabase
            let words = try await wordRepo.fetchAll(deckId: deckId)

            // Upsert CachedDeck
            let cachedDeck = CachedDeck(from: deck)
            context.insert(cachedDeck)

            // Upsert CachedWords
            for word in words {
                let cached = CachedWord(
                    id: word.id,
                    deckId: word.deckId,
                    word: word.word,
                    translation: word.translation,
                    contextSentence: word.contextSentence,
                    sourceType: word.sourceType.rawValue,
                    easeFactor: word.easeFactor,
                    intervalDays: word.intervalDays,
                    repetitions: word.repetitions,
                    nextReviewAt: ISO8601DateFormatter().date(from: word.nextReviewAt) ?? Date()
                )
                context.insert(cached)
            }

            try context.save()
        } catch {
            // Clean up on failure
            removeDeck(deckId: deckId, context: context)
        }
    }

    // MARK: - Check Download Status

    func isDownloaded(deckId: UUID, context: ModelContext) -> Bool {
        let descriptor = FetchDescriptor<CachedDeck>(predicate: #Predicate { $0.id == deckId })
        return (try? context.fetchCount(descriptor)) ?? 0 > 0
    }

    func cachedWordCount(deckId: UUID, context: ModelContext) -> Int {
        let descriptor = FetchDescriptor<CachedWord>(predicate: #Predicate { $0.deckId == deckId })
        return (try? context.fetchCount(descriptor)) ?? 0
    }

    // MARK: - Remove Downloaded Deck

    func removeDeck(deckId: UUID, context: ModelContext) {
        do {
            try context.delete(model: CachedDeck.self, where: #Predicate { $0.id == deckId })
            try context.delete(model: CachedWord.self, where: #Predicate { $0.deckId == deckId })
            try context.save()
        } catch {}
    }

    // MARK: - Build Offline Training Queue

    func buildOfflineQueue(deckId: UUID, scope: StudyScope, sessionSize: Int, context: ModelContext) -> [Word] {
        let now = Date()
        var descriptor = FetchDescriptor<CachedWord>(predicate: #Predicate { $0.deckId == deckId })
        descriptor.fetchLimit = sessionSize == 0 ? 999 : sessionSize

        do {
            let cached: [CachedWord]

            switch scope {
            case .smart:
                // Due words first
                var dueDescriptor = FetchDescriptor<CachedWord>(predicate: #Predicate {
                    $0.deckId == deckId && $0.nextReviewAt <= now && $0.repetitions > 0
                })
                dueDescriptor.fetchLimit = sessionSize == 0 ? 999 : sessionSize
                var due = try context.fetch(dueDescriptor)

                let remaining = (sessionSize == 0 ? 999 : sessionSize) - due.count
                if remaining > 0 {
                    var newDescriptor = FetchDescriptor<CachedWord>(predicate: #Predicate {
                        $0.deckId == deckId && $0.repetitions == 0
                    })
                    newDescriptor.fetchLimit = remaining
                    let newWords = try context.fetch(newDescriptor)
                    due.append(contentsOf: newWords)
                }
                cached = due

            case .all:
                cached = try context.fetch(descriptor)

            case .mistakes:
                var mistakeDescriptor = FetchDescriptor<CachedWord>(predicate: #Predicate {
                    $0.deckId == deckId && $0.easeFactor < 2.2 && $0.repetitions > 0
                })
                mistakeDescriptor.fetchLimit = sessionSize == 0 ? 999 : sessionSize
                cached = try context.fetch(mistakeDescriptor)

            case .newOnly:
                var newDescriptor = FetchDescriptor<CachedWord>(predicate: #Predicate {
                    $0.deckId == deckId && $0.repetitions == 0
                })
                newDescriptor.fetchLimit = sessionSize == 0 ? 999 : sessionSize
                cached = try context.fetch(newDescriptor)
            }

            return cached.map { $0.toWord() }.shuffled()
        } catch {
            return []
        }
    }

    // MARK: - Update Cached SRS After Answer

    func updateCachedWord(id: UUID, srs: SRSResult, context: ModelContext) {
        let descriptor = FetchDescriptor<CachedWord>(predicate: #Predicate { $0.id == id })
        guard let cached = try? context.fetch(descriptor).first else { return }

        cached.easeFactor = srs.easeFactor
        cached.intervalDays = srs.interval
        cached.repetitions = srs.repetitions
        cached.nextReviewAt = srs.nextReviewAt
        try? context.save()
    }

    // MARK: - Save Pending Review (for offline sync)

    func savePendingReview(sessionId: UUID, wordId: UUID, quality: Int, wasCorrect: Bool, srs: SRSResult, context: ModelContext) {
        let review = PendingReview(
            sessionId: sessionId,
            wordId: wordId,
            quality: quality,
            wasCorrect: wasCorrect,
            newEaseFactor: srs.easeFactor,
            newInterval: srs.interval,
            newRepetitions: srs.repetitions,
            nextReviewAt: srs.nextReviewAt
        )
        context.insert(review)
        try? context.save()
    }

    // MARK: - Sync Pending Reviews to Supabase

    func syncPendingReviews(context: ModelContext) async {
        let descriptor = FetchDescriptor<PendingReview>(sortBy: [SortDescriptor(\.createdAt)])
        guard let reviews = try? context.fetch(descriptor), !reviews.isEmpty else { return }

        for review in reviews {
            do {
                // Update SRS on server
                try await wordRepo.updateSRS(
                    id: review.wordId,
                    easeFactor: review.newEaseFactor,
                    interval: review.newInterval,
                    repetitions: review.newRepetitions,
                    nextReviewAt: ISO8601DateFormatter().string(from: review.nextReviewAt)
                )
                // Log the review
                try await trainingRepo.logReview(
                    sessionId: review.sessionId,
                    wordId: review.wordId,
                    quality: review.quality,
                    wasCorrect: review.wasCorrect
                )
                // Delete synced review
                context.delete(review)
            } catch {
                // Stop on first failure — will retry next launch
                break
            }
        }
        try? context.save()
    }

    // MARK: - Refresh Downloaded Deck (re-download fresh data)

    func refreshDeck(deckId: UUID, deck: Deck, context: ModelContext) async {
        removeDeck(deckId: deckId, context: context)
        await downloadDeck(deckId: deckId, deck: deck, context: context)
    }
}

// MARK: - CachedWord → Word Conversion

extension CachedWord {
    func toWord() -> Word {
        Word(
            id: id,
            deckId: deckId,
            word: word,
            translation: translation,
            contextSentence: contextSentence,
            sourceType: WordSourceType(rawValue: sourceType) ?? .manual,
            easeFactor: easeFactor,
            intervalDays: intervalDays,
            repetitions: repetitions,
            nextReviewAt: ISO8601DateFormatter().string(from: nextReviewAt),
            createdAt: "",
            updatedAt: ""
        )
    }
}

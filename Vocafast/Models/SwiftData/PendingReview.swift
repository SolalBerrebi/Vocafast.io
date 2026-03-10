import Foundation
import SwiftData

@Model
class PendingReview {
    var id: UUID = UUID()
    var sessionId: UUID
    var wordId: UUID
    var quality: Int
    var wasCorrect: Bool
    var newEaseFactor: Double
    var newInterval: Int
    var newRepetitions: Int
    var nextReviewAt: Date
    var createdAt: Date = Date()

    init(sessionId: UUID, wordId: UUID, quality: Int, wasCorrect: Bool, newEaseFactor: Double, newInterval: Int, newRepetitions: Int, nextReviewAt: Date) {
        self.sessionId = sessionId
        self.wordId = wordId
        self.quality = quality
        self.wasCorrect = wasCorrect
        self.newEaseFactor = newEaseFactor
        self.newInterval = newInterval
        self.newRepetitions = newRepetitions
        self.nextReviewAt = nextReviewAt
    }
}

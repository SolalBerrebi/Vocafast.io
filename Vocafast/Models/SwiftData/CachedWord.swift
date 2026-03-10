import Foundation
import SwiftData

@Model
class CachedWord {
    @Attribute(.unique) var id: UUID
    var deckId: UUID
    var word: String
    var translation: String
    var contextSentence: String?
    var sourceType: String
    var easeFactor: Double
    var intervalDays: Int
    var repetitions: Int
    var nextReviewAt: Date
    var lastSynced: Date

    init(id: UUID, deckId: UUID, word: String, translation: String, contextSentence: String?, sourceType: String, easeFactor: Double, intervalDays: Int, repetitions: Int, nextReviewAt: Date, lastSynced: Date = Date()) {
        self.id = id
        self.deckId = deckId
        self.word = word
        self.translation = translation
        self.contextSentence = contextSentence
        self.sourceType = sourceType
        self.easeFactor = easeFactor
        self.intervalDays = intervalDays
        self.repetitions = repetitions
        self.nextReviewAt = nextReviewAt
        self.lastSynced = lastSynced
    }
}

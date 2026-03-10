import Foundation

enum WordSourceType: String, Codable {
    case manual, photo, audio, conversation, text, topic
}

struct Word: Codable, Identifiable {
    let id: UUID
    let deckId: UUID
    var word: String
    var translation: String
    var contextSentence: String?
    var sourceType: WordSourceType
    var easeFactor: Double
    var intervalDays: Int
    var repetitions: Int
    var nextReviewAt: String
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case deckId = "deck_id"
        case word, translation
        case contextSentence = "context_sentence"
        case sourceType = "source_type"
        case easeFactor = "ease_factor"
        case intervalDays = "interval_days"
        case repetitions
        case nextReviewAt = "next_review_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

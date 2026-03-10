import Foundation

struct ReviewLog: Codable, Identifiable {
    let id: UUID
    let sessionId: UUID
    let wordId: UUID
    var quality: Int
    var wasCorrect: Bool
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case sessionId = "session_id"
        case wordId = "word_id"
        case quality
        case wasCorrect = "was_correct"
        case createdAt = "created_at"
    }
}

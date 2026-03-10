import Foundation

enum TrainingMode: String, Codable {
    case flashcard, multiple_choice, typing
}

struct TrainingSession: Codable, Identifiable {
    let id: UUID
    let environmentId: UUID
    var deckId: UUID?
    var mode: TrainingMode
    var correct: Int
    var incorrect: Int
    let startedAt: String
    var finishedAt: String?
    var durationSeconds: Int?
    var avgResponseTimeMs: Int?
    var xpEarned: Int

    enum CodingKeys: String, CodingKey {
        case id
        case environmentId = "environment_id"
        case deckId = "deck_id"
        case mode, correct, incorrect
        case startedAt = "started_at"
        case finishedAt = "finished_at"
        case durationSeconds = "duration_seconds"
        case avgResponseTimeMs = "avg_response_time_ms"
        case xpEarned = "xp_earned"
    }
}

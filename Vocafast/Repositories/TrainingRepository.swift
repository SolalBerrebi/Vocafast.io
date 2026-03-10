import Foundation
import Supabase

final class TrainingRepository {
    private let supabase = SupabaseManager.shared.client

    struct SessionSummaryRow: Decodable {
        let correct: Int
        let incorrect: Int
        let startedAt: String

        enum CodingKeys: String, CodingKey {
            case correct, incorrect
            case startedAt = "started_at"
        }
    }

    func fetchCompletedSessions(environmentId: UUID) async throws -> [SessionSummaryRow] {
        try await supabase
            .from("training_sessions")
            .select("correct, incorrect, started_at")
            .eq("environment_id", value: environmentId)
            .not("finished_at", operator: .is, value: "null")
            .execute()
            .value
    }

    func createSession(environmentId: UUID, deckId: UUID, mode: TrainingMode) async throws -> TrainingSession {
        try await supabase
            .from("training_sessions")
            .insert([
                "environment_id": AnyJSON.string(environmentId.uuidString),
                "deck_id": AnyJSON.string(deckId.uuidString),
                "mode": AnyJSON.string(mode.rawValue),
            ])
            .select()
            .single()
            .execute()
            .value
    }

    func finishSession(id: UUID, correct: Int, incorrect: Int, duration: Int, avgTime: Int, xp: Int) async throws {
        try await supabase
            .from("training_sessions")
            .update([
                "correct": AnyJSON.integer(correct),
                "incorrect": AnyJSON.integer(incorrect),
                "finished_at": AnyJSON.string(Date().iso8601String),
                "duration_seconds": AnyJSON.integer(duration),
                "avg_response_time_ms": AnyJSON.integer(avgTime),
                "xp_earned": AnyJSON.integer(xp),
            ])
            .eq("id", value: id)
            .execute()
    }

    func logReview(sessionId: UUID, wordId: UUID, quality: Int, wasCorrect: Bool) async throws {
        try await supabase
            .from("review_logs")
            .insert([
                "session_id": AnyJSON.string(sessionId.uuidString),
                "word_id": AnyJSON.string(wordId.uuidString),
                "quality": AnyJSON.integer(quality),
                "was_correct": AnyJSON.bool(wasCorrect),
            ])
            .execute()
    }
}

import Foundation
import Supabase

final class DeckRepository {
    private let supabase = SupabaseManager.shared.client

    func fetchAll(environmentId: UUID) async throws -> [Deck] {
        try await supabase
            .from("decks")
            .select()
            .eq("environment_id", value: environmentId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func fetch(id: UUID) async throws -> Deck {
        try await supabase
            .from("decks")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    func fetchSummaries(environmentId: UUID) async throws -> [(id: UUID, wordCount: Int)] {
        struct Row: Decodable {
            let id: UUID
            let wordCount: Int
            enum CodingKeys: String, CodingKey {
                case id
                case wordCount = "word_count"
            }
        }
        let rows: [Row] = try await supabase
            .from("decks")
            .select("id, word_count")
            .eq("environment_id", value: environmentId)
            .execute()
            .value
        return rows.map { ($0.id, $0.wordCount) }
    }

    func getEnvironmentId(deckId: UUID) async throws -> UUID {
        struct Row: Decodable {
            let environmentId: UUID
            enum CodingKeys: String, CodingKey {
                case environmentId = "environment_id"
            }
        }
        let row: Row = try await supabase
            .from("decks")
            .select("environment_id")
            .eq("id", value: deckId)
            .single()
            .execute()
            .value
        return row.environmentId
    }

    func create(environmentId: UUID, name: String, color: String, icon: String) async throws -> Deck {
        try await supabase
            .from("decks")
            .insert([
                "environment_id": AnyJSON.string(environmentId.uuidString),
                "name": AnyJSON.string(name),
                "color": AnyJSON.string(color),
                "icon": AnyJSON.string(icon),
            ])
            .select()
            .single()
            .execute()
            .value
    }

    func delete(id: UUID) async throws {
        try await supabase
            .from("decks")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}

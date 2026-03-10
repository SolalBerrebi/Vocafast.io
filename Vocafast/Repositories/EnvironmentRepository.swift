import Foundation
import Supabase

final class EnvironmentRepository {
    private let supabase = SupabaseManager.shared.client

    func fetchAll() async throws -> [LanguageEnvironment] {
        try await supabase
            .from("language_environments")
            .select()
            .order("created_at")
            .execute()
            .value
    }

    func getTargetLang(envId: UUID) async throws -> String {
        struct Row: Decodable {
            let targetLang: String
            enum CodingKeys: String, CodingKey {
                case targetLang = "target_lang"
            }
        }
        let row: Row = try await supabase
            .from("language_environments")
            .select("target_lang")
            .eq("id", value: envId)
            .single()
            .execute()
            .value
        return row.targetLang
    }

    func create(targetLang: String, color: String = "#007AFF", icon: String = "🌍", isActive: Bool = false) async throws -> LanguageEnvironment {
        let userId = try await supabase.auth.session.user.id
        return try await supabase
            .from("language_environments")
            .insert([
                "user_id": AnyJSON.string(userId.uuidString),
                "target_lang": AnyJSON.string(targetLang),
                "is_active": AnyJSON.bool(isActive),
                "color": AnyJSON.string(color),
                "icon": AnyJSON.string(icon),
            ])
            .select()
            .single()
            .execute()
            .value
    }

    func deactivateAll(except id: UUID) async throws {
        try await supabase
            .from("language_environments")
            .update(["is_active": false])
            .neq("id", value: id)
            .execute()
    }

    func activate(id: UUID) async throws {
        try await supabase
            .from("language_environments")
            .update(["is_active": true])
            .eq("id", value: id)
            .execute()
    }

    func delete(id: UUID) async throws {
        try await supabase
            .from("language_environments")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}

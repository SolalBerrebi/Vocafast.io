import Foundation
import Supabase

final class NotificationPreferencesRepository {
    private let supabase = SupabaseManager.shared.client

    func fetch() async throws -> NotificationPreferences? {
        let userId = try await supabase.auth.session.user.id
        let result: [NotificationPreferences] = try await supabase
            .from("notification_preferences")
            .select()
            .eq("user_id", value: userId)
            .execute()
            .value
        return result.first
    }

    func upsert(_ prefs: NotificationPreferences) async throws {
        try await supabase
            .from("notification_preferences")
            .upsert(prefs, onConflict: "user_id")
            .execute()
    }
}

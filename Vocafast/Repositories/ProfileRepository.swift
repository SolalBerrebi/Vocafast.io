import Foundation
import Supabase

final class ProfileRepository {
    private let supabase = SupabaseManager.shared.client

    func getProfile() async throws -> Profile {
        let userId = try await supabase.auth.session.user.id
        return try await supabase
            .from("profiles")
            .select()
            .eq("id", value: userId)
            .single()
            .execute()
            .value
    }

    func getNativeLang() async throws -> String {
        let profile = try await getProfile()
        return profile.nativeLang
    }

    func updateNativeLang(_ lang: String) async throws {
        let userId = try await supabase.auth.session.user.id
        try await supabase
            .from("profiles")
            .update(["native_lang": lang])
            .eq("id", value: userId)
            .execute()
    }

    func completeOnboarding() async throws {
        let userId = try await supabase.auth.session.user.id
        try await supabase
            .from("profiles")
            .update(["onboarding_completed": true])
            .eq("id", value: userId)
            .execute()
    }

    func updateGamification(xp: Int, level: Int, streak: Int, date: String) async throws {
        let userId = try await supabase.auth.session.user.id
        try await supabase
            .from("profiles")
            .update([
                "total_xp": AnyJSON.integer(xp),
                "level": AnyJSON.integer(level),
                "streak_days": AnyJSON.integer(streak),
                "last_active_date": AnyJSON.string(date),
            ])
            .eq("id", value: userId)
            .execute()
    }

    func updateShowTimer(_ show: Bool) async throws {
        let userId = try await supabase.auth.session.user.id
        try await supabase
            .from("profiles")
            .update(["show_timer": show])
            .eq("id", value: userId)
            .execute()
    }
}

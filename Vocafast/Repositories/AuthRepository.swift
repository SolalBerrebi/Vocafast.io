import Foundation
import Supabase

final class AuthRepository {
    private let supabase = SupabaseManager.shared.client

    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String, displayName: String) async throws {
        try await supabase.auth.signUp(
            email: email,
            password: password,
            data: ["display_name": .string(displayName)]
        )
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
    }

    func resetPasswordForEmail(_ email: String) async throws {
        try await supabase.auth.resetPasswordForEmail(email)
    }

    func updatePassword(_ newPassword: String) async throws {
        try await supabase.auth.update(user: UserAttributes(password: newPassword))
    }

    func getCurrentUser() async throws -> User? {
        try await supabase.auth.session.user
    }

    var currentUserId: UUID? {
        get async {
            try? await supabase.auth.session.user.id
        }
    }
}

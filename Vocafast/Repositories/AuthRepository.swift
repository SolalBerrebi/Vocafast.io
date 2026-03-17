import Foundation
import Supabase
import AuthenticationServices

final class AuthRepository {
    private let supabase = SupabaseManager.shared.client

    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String, displayName: String) async throws {
        try await supabase.auth.signUp(
            email: email,
            password: password,
            data: ["display_name": .string(displayName)],
            redirectTo: URL(string: "https://vocafast-io.com/callback")
        )
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
    }

    func resetPasswordForEmail(_ email: String) async throws {
        try await supabase.auth.resetPasswordForEmail(
            email,
            redirectTo: URL(string: "https://vocafast-io.com/reset-password")
        )
    }

    func updatePassword(_ newPassword: String) async throws {
        try await supabase.auth.update(user: UserAttributes(password: newPassword))
    }

    func updateEmail(_ newEmail: String) async throws {
        try await supabase.auth.update(user: UserAttributes(email: newEmail))
    }

    func getCurrentUser() async throws -> User? {
        try await supabase.auth.session.user
    }

    var currentUserId: UUID? {
        get async {
            try? await supabase.auth.session.user.id
        }
    }

    // MARK: - Apple Sign-In

    func signInWithApple(idToken: String, fullName: String?) async throws {
        try await supabase.auth.signInWithIdToken(
            credentials: .init(provider: .apple, idToken: idToken)
        )

        // fullName is only provided on first sign-in (account creation)
        if let fullName {
            _ = try? await supabase.auth.update(
                user: UserAttributes(data: ["display_name": .string(fullName)])
            )
        }
    }

    // MARK: - Google Sign-In (OAuth)

    func signInWithGoogle() async throws {
        try await supabase.auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "vocafast://callback")
        )
    }
}

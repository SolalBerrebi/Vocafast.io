import SwiftUI
import AuthenticationServices

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var displayName = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSignupSuccess = false

    private let authRepo = AuthRepository()

    // MARK: - Sign In

    func signIn() async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter email and password."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.signIn(email: email, password: password)
            // AppState's auth listener handles navigation
        } catch {
            errorMessage = error.localizedDescription
            HapticsManager.error()
        }

        isLoading = false
    }

    // MARK: - Sign Up

    func signUp() async {
        guard !displayName.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.signUp(email: email, password: password, displayName: displayName)
            showSignupSuccess = true
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
            HapticsManager.error()
        }

        isLoading = false
    }

    // MARK: - Apple Sign-In

    func handleAppleSignIn(result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = credential.identityToken,
                  let idToken = String(data: identityTokenData, encoding: .utf8)
            else {
                errorMessage = "Invalid Apple credentials."
                HapticsManager.error()
                return
            }

            let fullName = credential.fullName.flatMap {
                PersonNameComponentsFormatter.localizedString(from: $0, style: .default, options: [])
            }?.trimmingCharacters(in: .whitespaces)

            let cleanName = (fullName?.isEmpty == false) ? fullName : nil

            Task {
                isLoading = true
                errorMessage = nil
                do {
                    try await authRepo.signInWithApple(idToken: idToken, fullName: cleanName)
                } catch {
                    errorMessage = error.localizedDescription
                    HapticsManager.error()
                }
                isLoading = false
            }

        case .failure(let error):
            // Don't show error for user cancellation
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                errorMessage = error.localizedDescription
                HapticsManager.error()
            }
        }
    }

    // MARK: - Google Sign-In

    func signInWithGoogle() async {
        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.signInWithGoogle()
        } catch {
            let nsError = error as NSError
            // Don't show error for user cancellation
            if !(nsError.domain == ASWebAuthenticationSessionErrorDomain
                && nsError.code == ASWebAuthenticationSessionError.canceledLogin.rawValue) {
                errorMessage = error.localizedDescription
                HapticsManager.error()
            }
        }

        isLoading = false
    }

    // MARK: - Reset Password

    func resetPassword() async {
        guard !email.isEmpty else {
            errorMessage = "Please enter your email."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.resetPasswordForEmail(email)
            showSignupSuccess = true // Reuse for "check email" state
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Update Password

    func updatePassword() async {
        guard !password.isEmpty else {
            errorMessage = "Please enter a new password."
            return
        }
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters."
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords don't match."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.updatePassword(password)
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func clearError() {
        errorMessage = nil
    }
}

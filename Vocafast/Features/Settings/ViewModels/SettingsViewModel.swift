import SwiftUI
import UniformTypeIdentifiers

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var email: String = ""
    @Published var notificationPrefs: NotificationPreferences?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    // Change password
    @Published var newPassword = ""
    @Published var confirmPassword = ""
    @Published var showChangePassword = false

    // Change email
    @Published var newEmail = ""
    @Published var showChangeEmail = false

    // Add language
    @Published var showAddLanguage = false
    @Published var selectedNewLang: String?

    // Delete language
    @Published var showDeleteLanguage = false
    @Published var deletingEnvironmentId: UUID?

    // Daily goal
    @Published var showDailyGoal = false
    @Published var dailyGoalWords: Double = 20
    @Published var dailyGoalSessions: Double = 1

    // Delete account
    @Published var showDeleteAccount = false
    @Published var deleteConfirmText = ""
    @Published var isDeletingAccount = false

    // Import
    @Published var showImportPicker = false
    @Published var importResult: ImportResult?

    private let supabase = SupabaseManager.shared.client
    private let authRepo = AuthRepository()
    private let profileRepo = ProfileRepository()
    private let envRepo = EnvironmentRepository()
    private let deckRepo = DeckRepository()
    private let wordRepo = WordRepository()
    private let notifRepo = NotificationPreferencesRepository()

    func load() async {
        do {
            if let user = try await authRepo.getCurrentUser() {
                email = user.email ?? ""
            }
            notificationPrefs = try await notifRepo.fetch()
            if let prefs = notificationPrefs {
                dailyGoalWords = Double(prefs.dailyGoalWords)
                dailyGoalSessions = Double(prefs.dailyGoalSessions)
            }
        } catch {}
    }

    // MARK: - Password Change

    func changePassword() async {
        guard !newPassword.isEmpty else {
            errorMessage = "Please enter a new password."
            return
        }
        guard newPassword.count >= 6 else {
            errorMessage = "Password must be at least 6 characters."
            return
        }
        guard newPassword == confirmPassword else {
            errorMessage = "Passwords don't match."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.updatePassword(newPassword)
            showChangePassword = false
            newPassword = ""
            confirmPassword = ""
            successMessage = "Password updated successfully."
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Email Change

    func changeEmail() async {
        let trimmed = newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            errorMessage = "Please enter a new email address."
            return
        }
        guard trimmed.contains("@") && trimmed.contains(".") else {
            errorMessage = "Please enter a valid email address."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authRepo.updateEmail(trimmed)
            showChangeEmail = false
            newEmail = ""
            successMessage = "Confirmation email sent. Please check your new inbox to confirm the change."
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Language Management

    func addLanguage(appState: AppState) async {
        guard let lang = selectedNewLang else { return }

        isLoading = true
        do {
            let flag = Config.languageFlag(for: lang)
            _ = try await envRepo.create(targetLang: lang, color: "#007AFF", icon: flag)
            await appState.fetchEnvironments()
            showAddLanguage = false
            selectedNewLang = nil
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func deleteLanguage(appState: AppState) async {
        guard let envId = deletingEnvironmentId else { return }
        guard appState.environments.count > 1 else {
            errorMessage = "Cannot delete the last remaining language."
            return
        }

        isLoading = true
        do {
            try await envRepo.delete(id: envId)
            await appState.fetchEnvironments()
            showDeleteLanguage = false
            deletingEnvironmentId = nil
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func setDefaultLanguage(_ envId: UUID, appState: AppState) async {
        await appState.switchEnvironment(to: envId)
        HapticsManager.success()
    }

    // MARK: - Notifications

    func toggleNotifications(_ enabled: Bool) async {
        if enabled {
            let granted = await NotificationScheduler.requestPermission()
            if !granted {
                errorMessage = "Please enable notifications in Settings."
                return
            }
        }

        guard var prefs = notificationPrefs else { return }
        prefs.notificationsEnabled = enabled
        do {
            try await notifRepo.upsert(prefs)
            notificationPrefs = prefs
            NotificationScheduler.syncWithPreferences(prefs)
        } catch {}
    }

    func updateNotificationPrefs() async {
        guard var prefs = notificationPrefs else { return }
        prefs.dailyGoalWords = Int(dailyGoalWords)
        prefs.dailyGoalSessions = Int(dailyGoalSessions)
        do {
            try await notifRepo.upsert(prefs)
            notificationPrefs = prefs
            NotificationScheduler.syncWithPreferences(prefs)
        } catch {}
    }

    // MARK: - Import

    func importFile(data: Data, fileName: String, appState: AppState) async {
        isLoading = true
        errorMessage = nil

        let content = String(data: data, encoding: .utf8) ?? ""
        let meta = DeckImporter.parse(fileContent: content, fileName: fileName)

        guard !meta.words.isEmpty else {
            errorMessage = "No valid word pairs found. Expected format: word and translation separated by tab, comma, or semicolon."
            isLoading = false
            return
        }

        do {
            // Resolve the target environment
            let envId: UUID

            if let targetLang = meta.targetLang, !targetLang.isEmpty {
                // File specifies a language — find or create the matching environment
                if let existing = appState.environments.first(where: { $0.targetLang == targetLang }) {
                    envId = existing.id
                } else {
                    // Auto-create the language environment
                    let flag = Config.languageFlag(for: targetLang)
                    let newEnv = try await envRepo.create(targetLang: targetLang, color: "#007AFF", icon: flag)
                    await appState.fetchEnvironments()
                    envId = newEnv.id
                }

                // Switch to the imported language so the user sees the new deck
                await appState.switchEnvironment(to: envId)
            } else {
                // No language info — use active environment
                guard let activeId = appState.activeEnvironmentId else {
                    errorMessage = "No active language."
                    isLoading = false
                    return
                }
                envId = activeId
            }

            let cappedWords = Array(meta.words.prefix(500))
            let resolvedName = meta.deckName ?? fileName.replacingOccurrences(of: "\\.[^.]+$", with: "", options: .regularExpression)
            let deckColor = meta.color ?? "#5856D6"
            let deckIcon = meta.icon ?? "📥"

            let deck = try await deckRepo.create(
                environmentId: envId,
                name: resolvedName,
                color: deckColor,
                icon: deckIcon
            )

            _ = try await wordRepo.addBatch(
                deckId: deck.id,
                words: cappedWords.map { ($0.word, $0.translation, $0.context) },
                sourceType: .manual
            )

            importResult = ImportResult(
                deckId: deck.id,
                deckName: resolvedName,
                wordCount: cappedWords.count,
                totalInFile: meta.words.count,
                capped: meta.words.count > 500
            )
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Delete Account

    func deleteAccount() async {
        guard deleteConfirmText.lowercased() == "delete" else {
            errorMessage = "Please type DELETE to confirm."
            return
        }

        isDeletingAccount = true
        errorMessage = nil

        do {
            // Call the RPC function that deletes the user from auth.users
            // All data cascades automatically via foreign keys
            try await supabase.rpc("delete_own_account").execute()

            // Sign out locally
            try? await authRepo.signOut()
        } catch {
            errorMessage = "Failed to delete account: \(error.localizedDescription)"
            isDeletingAccount = false
        }
    }

    // MARK: - Sign Out

    func signOut() async {
        do {
            try await authRepo.signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

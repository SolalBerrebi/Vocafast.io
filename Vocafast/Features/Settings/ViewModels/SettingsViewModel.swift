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

    // Import
    @Published var showImportPicker = false
    @Published var importResult: ImportResult?

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
            if !enabled {
                NotificationScheduler.cancelAll()
            }
        } catch {}
    }

    func updateNotificationPrefs() async {
        guard var prefs = notificationPrefs else { return }
        prefs.dailyGoalWords = Int(dailyGoalWords)
        prefs.dailyGoalSessions = Int(dailyGoalSessions)
        do {
            try await notifRepo.upsert(prefs)
            notificationPrefs = prefs
        } catch {}
    }

    // MARK: - Import

    func importFile(data: Data, fileName: String, appState: AppState) async {
        guard let envId = appState.activeEnvironmentId else {
            errorMessage = "No active language."
            return
        }

        isLoading = true
        errorMessage = nil

        let content = String(data: data, encoding: .utf8) ?? ""
        let (words, deckName) = DeckImporter.parse(fileContent: content, fileName: fileName)

        guard !words.isEmpty else {
            errorMessage = "No valid word pairs found. Expected format: word and translation separated by tab, comma, or semicolon."
            isLoading = false
            return
        }

        let cappedWords = Array(words.prefix(500))
        let resolvedName = deckName ?? fileName.replacingOccurrences(of: "\\.[^.]+$", with: "", options: .regularExpression)

        do {
            let deck = try await deckRepo.create(
                environmentId: envId,
                name: resolvedName,
                color: "#5856D6",
                icon: "📥"
            )

            _ = try await wordRepo.addBatch(
                deckId: deck.id,
                words: cappedWords.map { ($0.word, $0.translation) },
                sourceType: .manual
            )

            importResult = ImportResult(
                deckId: deck.id,
                deckName: resolvedName,
                wordCount: cappedWords.count,
                totalInFile: words.count,
                capped: words.count > 500
            )
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
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

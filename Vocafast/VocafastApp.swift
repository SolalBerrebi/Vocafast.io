import SwiftUI
import SwiftData
import Supabase
import UserNotifications

@main
struct VocafastApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .task { await syncNotificationsOnLaunch() }
                .task { await syncOfflineReviewsOnLaunch() }
        }
        .modelContainer(for: [
            CachedDeck.self,
            CachedWord.self,
            PendingReview.self,
            CachedStats.self,
        ])
    }

    @MainActor
    private func syncOfflineReviewsOnLaunch() async {
        // Sync any pending reviews from offline training sessions
        guard let container = try? ModelContainer(for: CachedDeck.self, CachedWord.self, PendingReview.self, CachedStats.self) else { return }
        let context = ModelContext(container)
        await OfflineDeckManager.shared.syncPendingReviews(context: context)
    }

    private func syncNotificationsOnLaunch() async {
        do {
            let prefs = try await NotificationPreferencesRepository().fetch()
            if let prefs {
                NotificationScheduler.syncWithPreferences(prefs)
            }
        } catch {}
    }
}

// MARK: - AppDelegate for Notification Handling

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    // Show notifications when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }
}

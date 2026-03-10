import SwiftUI
import SwiftData
import Supabase

@main
struct VocafastApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
        }
        .modelContainer(for: [
            CachedDeck.self,
            CachedWord.self,
            PendingReview.self,
            CachedStats.self,
        ])
    }
}

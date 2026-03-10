import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DecksView()
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            XPPillView()
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            EnvironmentSwitcherView()
                        }
                    }
            }
            .tabItem {
                Label("Decks", systemImage: "rectangle.stack")
            }
            .tag(0)

            NavigationStack {
                ProgressStatsView()
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            XPPillView()
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            EnvironmentSwitcherView()
                        }
                    }
            }
            .tabItem {
                Label("Progress", systemImage: "chart.bar")
            }
            .tag(1)

            NavigationStack {
                SettingsView()
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            XPPillView()
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            EnvironmentSwitcherView()
                        }
                    }
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
            .tag(2)
        }
    }
}

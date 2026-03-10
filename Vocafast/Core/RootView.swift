import SwiftUI

struct RootView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            switch appState.authState {
            case .loading:
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .unauthenticated:
                NavigationStack {
                    LoginView()
                }

            case .onboarding:
                NavigationStack {
                    NativeLangView()
                }

            case .authenticated:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.authState)
    }
}

extension AuthState: Equatable {
    static func == (lhs: AuthState, rhs: AuthState) -> Bool {
        switch (lhs, rhs) {
        case (.loading, .loading),
             (.unauthenticated, .unauthenticated),
             (.onboarding, .onboarding),
             (.authenticated, .authenticated):
            return true
        default:
            return false
        }
    }
}

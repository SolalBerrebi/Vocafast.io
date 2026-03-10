import SwiftUI
import Supabase

enum AuthState {
    case loading
    case unauthenticated
    case onboarding
    case authenticated
}

@MainActor
final class AppState: ObservableObject {
    @Published var authState: AuthState = .loading
    @Published var currentUserId: UUID?
    @Published var activeEnvironmentId: UUID?
    @Published var environments: [LanguageEnvironment] = []
    @Published var totalXp: Int = 0
    @Published var level: Int = 1
    @Published var streakDays: Int = 0
    @Published var lastActiveDate: String?
    @Published var showTimer: Bool = true

    private let supabase = SupabaseManager.shared.client
    private var authStateTask: Task<Void, Never>?

    init() {
        authStateTask = Task { [weak self] in
            await self?.listenToAuthChanges()
        }
    }

    deinit {
        authStateTask?.cancel()
    }

    // MARK: - Auth Listening

    private func listenToAuthChanges() async {
        for await (event, session) in supabase.auth.authStateChanges {
            switch event {
            case .initialSession:
                if let session {
                    currentUserId = session.user.id
                    await checkOnboardingAndLoad()
                } else {
                    authState = .unauthenticated
                }
            case .signedIn:
                if let session {
                    currentUserId = session.user.id
                    await checkOnboardingAndLoad()
                }
            case .signedOut:
                currentUserId = nil
                activeEnvironmentId = nil
                environments = []
                authState = .unauthenticated
            case .tokenRefreshed:
                break
            default:
                break
            }
        }
    }

    // MARK: - Onboarding Check

    func checkOnboardingAndLoad() async {
        guard let userId = currentUserId else {
            authState = .unauthenticated
            return
        }

        do {
            let profile: Profile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId)
                .single()
                .execute()
                .value

            if !profile.onboardingCompleted {
                authState = .onboarding
                return
            }

            // Load gamification data
            totalXp = profile.totalXp
            level = profile.level
            streakDays = profile.streakDays
            lastActiveDate = profile.lastActiveDate
            showTimer = profile.showTimer

            // Load environments
            await fetchEnvironments()

            authState = .authenticated
        } catch {
            // Profile might not exist yet (just signed up, waiting for trigger)
            authState = .onboarding
        }
    }

    // MARK: - Environment Management

    func fetchEnvironments() async {
        do {
            let envs: [LanguageEnvironment] = try await supabase
                .from("language_environments")
                .select()
                .order("created_at")
                .execute()
                .value

            environments = envs

            // Determine active environment
            if let currentActive = activeEnvironmentId,
               envs.contains(where: { $0.id == currentActive }) {
                // Keep current selection
            } else if let active = envs.first(where: { $0.isActive }) {
                activeEnvironmentId = active.id
            } else if let first = envs.first {
                activeEnvironmentId = first.id
            } else {
                activeEnvironmentId = nil
            }
        } catch {
            // Silently fail — environments will be empty
        }
    }

    func switchEnvironment(to id: UUID) async {
        guard id != activeEnvironmentId else { return }

        // Update local state immediately
        activeEnvironmentId = id
        environments = environments.map { env in
            var updated = env
            updated.isActive = env.id == id
            return updated
        }

        // Persist to DB
        do {
            try await supabase
                .from("language_environments")
                .update(["is_active": false])
                .neq("id", value: id)
                .execute()

            try await supabase
                .from("language_environments")
                .update(["is_active": true])
                .eq("id", value: id)
                .execute()
        } catch {
            // Local state already updated — DB will catch up
        }
    }

    var activeEnvironment: LanguageEnvironment? {
        environments.first(where: { $0.id == activeEnvironmentId })
    }

    // MARK: - Gamification

    func updateGamification(xp: Int, level: Int, streak: Int, date: String) {
        self.totalXp = xp
        self.level = level
        self.streakDays = streak
        self.lastActiveDate = date
    }
}

import SwiftUI

struct ProgressStatsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ProgressViewModel()
    @State private var animateIn = false

    private var currentLevel: Level {
        LevelSystem.getLevelForXP(appState.totalXp)
    }

    private var nextLevel: Level? {
        LevelSystem.getNextLevel(appState.totalXp)
    }

    private var xpProgress: Double {
        Double(LevelSystem.getXPProgress(appState.totalXp)) / 100.0
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.totalSessions == 0 && viewModel.totalWords == 0 {
                emptyState
            } else {
                mainContent
            }
        }
        .navigationTitle(L("progress_title"))
        .task {
            await viewModel.load(environmentId: appState.activeEnvironmentId)
            withAnimation(.easeOut(duration: 0.8)) {
                animateIn = true
            }
        }
        .onChange(of: appState.activeEnvironmentId) { _, newValue in
            animateIn = false
            Task {
                await viewModel.load(environmentId: newValue)
                withAnimation(.easeOut(duration: 0.8)) {
                    animateIn = true
                }
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [LevelSystem.gradientColors(for: 1).top.opacity(0.25), Color.clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 80
                        )
                    )
                    .frame(width: 160, height: 160)

                Text("🌱")
                    .font(.system(size: 64))
            }

            Text(L("progress_empty_title"))
                .font(.title2.bold())

            Text(L("progress_empty_desc"))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 40)
    }

    // MARK: - Main Content

    private var mainContent: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Hero Level Card
                levelHeroCard
                    .opacity(animateIn ? 1 : 0)
                    .offset(y: animateIn ? 0 : 20)

                // Streak + Accuracy
                HStack(spacing: 12) {
                    streakCard
                    accuracyCard
                }
                .padding(.horizontal, 16)
                .opacity(animateIn ? 1 : 0)
                .offset(y: animateIn ? 0 : 20)
                .animation(.easeOut(duration: 0.8).delay(0.1), value: animateIn)

                // Word stats
                HStack(spacing: 12) {
                    statCard(
                        value: "\(viewModel.totalWords)",
                        label: L("progress_words"),
                        icon: "textformat.abc",
                        gradient: [Color.blue, Color.cyan]
                    )
                    statCard(
                        value: "\(viewModel.masteredWords)",
                        label: L("progress_mastered"),
                        icon: "star.fill",
                        gradient: [Color.yellow, Color.orange]
                    )
                    statCard(
                        value: "\(viewModel.totalSessions)",
                        label: L("progress_sessions"),
                        icon: "bolt.fill",
                        gradient: [Color.purple, Color.pink]
                    )
                }
                .padding(.horizontal, 16)
                .opacity(animateIn ? 1 : 0)
                .offset(y: animateIn ? 0 : 20)
                .animation(.easeOut(duration: 0.8).delay(0.2), value: animateIn)

                // Activity Calendar
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundStyle(.green)
                        Text(L("progress_activity"))
                            .font(.headline)
                    }
                    .padding(.horizontal, 16)

                    StreakCalendarView(sessionDates: viewModel.sessionDates)
                        .padding(.horizontal, 16)
                }
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
                )
                .padding(.horizontal, 16)
                .opacity(animateIn ? 1 : 0)
                .offset(y: animateIn ? 0 : 20)
                .animation(.easeOut(duration: 0.8).delay(0.3), value: animateIn)
            }
            .padding(.vertical, 16)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Level Hero Card

    private var heroGradient: [Color] {
        LevelSystem.blendedGradient(totalXp: appState.totalXp)
    }

    private var ringColors: [Color] {
        let current = LevelSystem.gradientColors(for: currentLevel.level)
        if let next = nextLevel {
            let nextC = LevelSystem.gradientColors(for: next.level)
            return [current.top.opacity(0.9), nextC.top.opacity(0.9), current.top.opacity(0.9)]
        }
        return [current.top.opacity(0.9), current.top.opacity(0.6), current.top.opacity(0.9)]
    }

    private var levelHeroCard: some View {
        VStack(spacing: 16) {
            // Level ring + emoji
            ZStack {
                // Outer glow
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [heroGradient.first?.opacity(0.4) ?? Color.purple.opacity(0.3), Color.clear],
                            center: .center,
                            startRadius: 30,
                            endRadius: 70
                        )
                    )
                    .frame(width: 140, height: 140)

                // Track ring
                Circle()
                    .stroke(Color.white.opacity(0.15), lineWidth: 8)
                    .frame(width: 100, height: 100)

                // Progress ring — colors match the gradient blend
                Circle()
                    .trim(from: 0, to: animateIn ? xpProgress : 0)
                    .stroke(
                        AngularGradient(
                            colors: ringColors,
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 100, height: 100)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeOut(duration: 1.2).delay(0.3), value: animateIn)

                // Emoji
                Text(currentLevel.emoji)
                    .font(.system(size: 44))
            }

            // Level name
            Text(currentLevel.name)
                .font(.title2.bold())
                .foregroundStyle(.white)

            // XP display
            HStack(spacing: 4) {
                Text("\(appState.totalXp)")
                    .font(.headline)
                    .foregroundStyle(.white)

                if let next = nextLevel {
                    Text("/ \(next.xpRequired) XP")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                } else {
                    Text(L("progress_max_level"))
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }

            // XP bar
            if let next = nextLevel {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.2))
                            .frame(height: 6)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    colors: [heroGradient.first ?? .cyan, heroGradient.last ?? .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * (animateIn ? xpProgress : 0), height: 6)
                            .animation(.easeOut(duration: 1.0).delay(0.5), value: animateIn)
                    }
                }
                .frame(height: 6)
                .padding(.horizontal, 32)

                Text(LF("progress_xp_to_next", LevelSystem.getXPToNextLevel(appState.totalXp), next.name))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
        .padding(.vertical, 28)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(
                    LinearGradient(
                        colors: heroGradient,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: (heroGradient.first ?? .purple).opacity(0.3), radius: 20, y: 10)
        )
        .padding(.horizontal, 16)
    }

    // MARK: - Streak Card

    private var streakCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("🔥")
                    .font(.title3)
                Spacer()
            }

            Text("\(appState.streakDays)")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text(L("progress_day_streak"))
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(
                    LinearGradient(
                        colors: [Color.orange, Color.red],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: Color.orange.opacity(0.3), radius: 12, y: 6)
        )
    }

    // MARK: - Accuracy Card

    private var accuracyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 4)
                        .frame(width: 32, height: 32)

                    Circle()
                        .trim(from: 0, to: animateIn ? viewModel.accuracy / 100 : 0)
                        .stroke(Color.white, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .frame(width: 32, height: 32)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeOut(duration: 1.0).delay(0.5), value: animateIn)
                }
                Spacer()
            }

            Text(String(format: "%.0f%%", viewModel.accuracy))
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text(L("progress_accuracy"))
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(
                    LinearGradient(
                        colors: [Color.green, Color.teal],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: Color.green.opacity(0.3), radius: 12, y: 6)
        )
    }

    // MARK: - Small Stat Card

    private func statCard(value: String, label: String, icon: String, gradient: [Color]) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(
                    LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                )
                .frame(width: 36, height: 36)
                .background(
                    Circle()
                        .fill(gradient[0].opacity(0.12))
                )

            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))

            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.06), radius: 8, y: 3)
        )
    }
}

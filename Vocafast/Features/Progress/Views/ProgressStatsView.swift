import SwiftUI

struct ProgressStatsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ProgressViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.totalSessions == 0 && viewModel.totalWords == 0 {
                VStack(spacing: 16) {
                    Image(systemName: "chart.bar")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                    Text("No progress yet")
                        .font(.title2.bold())
                    Text("Complete a training session to see your stats")
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 40)
            } else {
                ScrollView {
                    VStack(spacing: 20) {
                        // Stats grid
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            StatsCardView(title: "Total Words", value: "\(viewModel.totalWords)", icon: "textformat.abc", color: .blue)
                            StatsCardView(title: "Mastered", value: "\(viewModel.masteredWords)", icon: "star.fill", color: .green)
                            StatsCardView(title: "Sessions", value: "\(viewModel.totalSessions)", icon: "play.circle.fill", color: .purple)
                            StatsCardView(title: "Accuracy", value: String(format: "%.0f%%", viewModel.accuracy), icon: "target", color: .orange)
                        }
                        .padding(.horizontal, 16)

                        // Streak calendar
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Activity")
                                .font(.headline)
                                .padding(.horizontal, 16)

                            StreakCalendarView(sessionDates: viewModel.sessionDates)
                                .padding(.horizontal, 16)
                        }
                    }
                    .padding(.vertical, 16)
                }
            }
        }
        .navigationTitle("Progress")
        .task {
            await viewModel.load(environmentId: appState.activeEnvironmentId)
        }
        .onChange(of: appState.activeEnvironmentId) { _, newValue in
            Task {
                await viewModel.load(environmentId: newValue)
            }
        }
    }
}

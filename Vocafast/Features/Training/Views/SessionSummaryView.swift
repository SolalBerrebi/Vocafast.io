import SwiftUI

struct SessionSummaryView: View {
    let correct: Int
    let hard: Int
    let incorrect: Int
    let durationSeconds: Int
    let avgResponseTimeMs: Int
    let xpResult: SessionXPResult?
    let previousLevel: Level
    let currentLevel: Level
    let onDone: () -> Void

    private var leveledUp: Bool {
        currentLevel.level > previousLevel.level
    }

    private var total: Int {
        correct + hard + incorrect
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 20)

                Text("Session Complete!")
                    .font(.largeTitle.bold())

                // Level up animation
                if leveledUp {
                    VStack(spacing: 8) {
                        Text(currentLevel.emoji)
                            .font(.system(size: 64))
                        Text("Level Up!")
                            .font(.title2.bold())
                            .foregroundStyle(.accentColor)
                        Text(currentLevel.name)
                            .font(.headline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 16)
                    .transition(.scale.combined(with: .opacity))
                }

                // Results bars
                VStack(spacing: 12) {
                    ResultBar(label: "Correct", count: correct, total: total, color: .green)
                    ResultBar(label: "Hard", count: hard, total: total, color: .orange)
                    ResultBar(label: "Incorrect", count: incorrect, total: total, color: .red)
                }
                .padding(.horizontal, 20)

                // Stats
                HStack(spacing: 24) {
                    VStack {
                        Text(formatDuration(durationSeconds))
                            .font(.title3.bold())
                        Text("Duration")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    VStack {
                        Text(String(format: "%.1fs", Double(avgResponseTimeMs) / 1000.0))
                            .font(.title3.bold())
                        Text("Avg Time")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                // XP Breakdown
                if let xp = xpResult {
                    VStack(spacing: 8) {
                        Text("XP Earned")
                            .font(.headline)

                        VStack(alignment: .leading, spacing: 4) {
                            XPRow(label: "Base XP", value: xp.baseXP)
                            if xp.speedBonus > 0 {
                                XPRow(label: "Speed Bonus", value: xp.speedBonus)
                            }
                            XPRow(label: "Completion Bonus", value: xp.completionBonus)
                            if xp.streakMultiplier > 1.0 {
                                HStack {
                                    Text("Streak Multiplier")
                                        .font(.subheadline)
                                    Spacer()
                                    Text("x\(String(format: "%.1f", xp.streakMultiplier))")
                                        .font(.subheadline.bold())
                                }
                            }
                            Divider()
                            HStack {
                                Text("Total")
                                    .font(.headline)
                                Spacer()
                                Text("+\(xp.totalXP) XP")
                                    .font(.headline)
                                    .foregroundStyle(.accentColor)
                            }
                        }
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color(.systemGray6))
                        )
                    }
                    .padding(.horizontal, 20)
                }

                // Done button
                Button {
                    onDone()
                } label: {
                    Text("Done")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .foregroundStyle(.white)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 20)

                Spacer().frame(height: 20)
            }
        }
    }

    private func formatDuration(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}

private struct ResultBar: View {
    let label: String
    let count: Int
    let total: Int
    let color: Color

    private var ratio: Double {
        total > 0 ? Double(count) / Double(total) : 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.subheadline)
                Spacer()
                Text("\(count)")
                    .font(.subheadline.bold())
                    .foregroundStyle(color)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geo.size.width * ratio, height: 8)
                }
            }
            .frame(height: 8)
        }
    }
}

private struct XPRow: View {
    let label: String
    let value: Int

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
            Spacer()
            Text("+\(value)")
                .font(.subheadline)
        }
    }
}

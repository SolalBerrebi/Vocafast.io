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

    @State private var showContent = false
    @State private var showXP = false
    @State private var countedXP = 0

    private var leveledUp: Bool {
        currentLevel.level > previousLevel.level
    }

    private var total: Int {
        correct + hard + incorrect
    }

    private var accuracy: Int {
        total > 0 ? Int(round(Double(correct + hard) / Double(total) * 100)) : 0
    }

    private var gradeEmoji: String {
        if accuracy >= 90 { return "🏆" }
        if accuracy >= 70 { return "⭐" }
        if accuracy >= 50 { return "💪" }
        return "📚"
    }

    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [
                    Color.accentColor.opacity(0.08),
                    Color(.systemBackground)
                ],
                startPoint: .top,
                endPoint: .center
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    Spacer().frame(height: 16)

                    // MARK: - Hero section
                    VStack(spacing: 8) {
                        Text(gradeEmoji)
                            .font(.system(size: 56))
                            .scaleEffect(showContent ? 1 : 0.3)
                            .opacity(showContent ? 1 : 0)

                        Text(L("summary_complete"))
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .opacity(showContent ? 1 : 0)
                    }

                    // MARK: - Level Up
                    if leveledUp {
                        VStack(spacing: 6) {
                            Text(currentLevel.emoji)
                                .font(.system(size: 44))
                            Text(L("summary_level_up"))
                                .font(.headline)
                                .foregroundStyle(Color.accentColor)
                            Text(currentLevel.name)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 8)
                        .transition(.scale.combined(with: .opacity))
                    }

                    // MARK: - Results Card
                    VStack(spacing: 14) {
                        // Result rows
                        ResultRow(label: L("summary_correct"), count: correct, total: total, color: .green)
                        ResultRow(label: L("summary_hard"), count: hard, total: total, color: .orange)
                        ResultRow(label: L("summary_incorrect"), count: incorrect, total: total, color: .red)

                        Divider()

                        // Stats
                        HStack {
                            StatBadge(icon: "clock", value: formatDuration(durationSeconds), label: L("summary_duration"))
                            Spacer()
                            StatBadge(icon: "bolt", value: String(format: "%.1fs", Double(avgResponseTimeMs) / 1000.0), label: L("summary_avg_time"))
                            Spacer()
                            StatBadge(icon: "percent", value: "\(accuracy)%", label: L("summary_accuracy"))
                        }
                    }
                    .padding(16)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .padding(.horizontal, 20)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 20)

                    // MARK: - XP Card
                    if let xp = xpResult {
                        VStack(spacing: 10) {
                            // Big XP number
                            Text("+\(countedXP) XP")
                                .font(.system(size: 36, weight: .heavy, design: .rounded))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [Color.accentColor, Color.accentColor.opacity(0.7)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )

                            // Breakdown
                            VStack(spacing: 4) {
                                XPRow(label: L("summary_base_xp"), value: "+\(xp.baseXP)")
                                if xp.speedBonus > 0 {
                                    XPRow(label: L("summary_speed_bonus"), value: "+\(xp.speedBonus)")
                                }
                                XPRow(label: L("summary_completion_bonus"), value: "+\(xp.completionBonus)")
                                if xp.streakMultiplier > 1.0 {
                                    XPRow(label: L("summary_streak_multiplier"), value: "x\(String(format: "%.1f", xp.streakMultiplier))")
                                }
                            }
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        }
                        .padding(16)
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .padding(.horizontal, 20)
                        .opacity(showXP ? 1 : 0)
                        .offset(y: showXP ? 0 : 20)
                    }

                    // MARK: - Done Button
                    Button {
                        HapticsManager.light()
                        onDone()
                    } label: {
                        Text(L("common_done"))
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .foregroundStyle(.white)
                            .background(Color.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .padding(.horizontal, 20)
                    .opacity(showXP ? 1 : 0)

                    Spacer().frame(height: 20)
                }
            }
        }
        .onAppear {
            // Staggered animations
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                showContent = true
            }

            // XP card after a delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                    showXP = true
                }
                // Haptic celebration
                HapticsManager.success()
            }

            // Animated XP counter
            if let xp = xpResult {
                animateXPCount(to: xp.totalXP)
            }

            // Extra haptic for level up
            if leveledUp {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                    HapticsManager.success()
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatDuration(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }

    private func animateXPCount(to target: Int) {
        let steps = min(target, 30)
        guard steps > 0 else {
            countedXP = target
            return
        }
        let stepDelay = 0.6 / Double(steps)

        for i in 1...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5 + Double(i) * stepDelay) {
                countedXP = Int(round(Double(target) * Double(i) / Double(steps)))
            }
        }
    }
}

// MARK: - Components

private struct ResultRow: View {
    let label: String
    let count: Int
    let total: Int
    let color: Color

    private var ratio: Double {
        total > 0 ? Double(count) / Double(total) : 0
    }

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)

            Text(label)
                .font(.subheadline)

            Spacer()

            Text("\(count)")
                .font(.subheadline.bold())
                .foregroundStyle(color)

            // Mini bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color(.systemGray5))
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(width: geo.size.width * ratio)
                }
            }
            .frame(width: 60, height: 6)
        }
    }
}

private struct StatBadge: View {
    let icon: String
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.bold())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
    }
}

private struct XPRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

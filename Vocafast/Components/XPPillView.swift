import SwiftUI

struct XPPillView: View {
    @EnvironmentObject var appState: AppState

    private var currentLevel: Level {
        LevelSystem.getLevelForXP(appState.totalXp)
    }

    private var progress: Double {
        Double(LevelSystem.getXPProgress(appState.totalXp)) / 100.0
    }

    var body: some View {
        HStack(spacing: 6) {
            Text(currentLevel.emoji)
                .font(.caption)

            Text(currentLevel.name)
                .font(.caption2.weight(.semibold))
                .lineLimit(1)

            // Mini progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemGray4))
                        .frame(height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.accentColor)
                        .frame(width: geo.size.width * progress, height: 4)
                }
            }
            .frame(width: 40, height: 4)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(Color(.systemGray6))
        )
    }
}

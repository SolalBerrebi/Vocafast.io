import SwiftUI

struct EnvironmentSwitcherView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Menu {
            ForEach(appState.environments) { env in
                Button {
                    Task {
                        await appState.switchEnvironment(to: env.id)
                    }
                } label: {
                    HStack {
                        Text("\(env.icon) \(Config.languageName(for: env.targetLang))")
                        if env.id == appState.activeEnvironmentId {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                if let env = appState.activeEnvironment {
                    Text(env.icon)
                        .font(.callout)
                    Text(Config.languageName(for: env.targetLang))
                        .font(.caption.weight(.semibold))
                        .lineLimit(1)
                } else {
                    Text("No language")
                        .font(.caption)
                }
                Image(systemName: "chevron.down")
                    .font(.caption2)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(Color(.systemGray6))
            )
        }
    }
}

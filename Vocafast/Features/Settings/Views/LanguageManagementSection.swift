import SwiftUI

struct LanguageManagementSection: View {
    @ObservedObject var viewModel: SettingsViewModel
    @EnvironmentObject var appState: AppState

    var body: some View {
        Section("Languages") {
            ForEach(appState.environments) { env in
                HStack {
                    Text(env.icon)
                    Text(Config.languageName(for: env.targetLang))

                    Spacer()

                    if env.id == appState.activeEnvironmentId {
                        Text("Default")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.green.opacity(0.15))
                            .foregroundStyle(.green)
                            .clipShape(Capsule())
                    } else {
                        Button {
                            Task { await viewModel.setDefaultLanguage(env.id, appState: appState) }
                        } label: {
                            Text("Set Default")
                                .font(.caption)
                        }
                    }

                    if appState.environments.count > 1 {
                        Button {
                            viewModel.deletingEnvironmentId = env.id
                            viewModel.showDeleteLanguage = true
                        } label: {
                            Image(systemName: "trash")
                                .foregroundStyle(.red)
                        }
                    }
                }
            }

            Button {
                viewModel.showAddLanguage = true
            } label: {
                Label("Add Language", systemImage: "plus.circle")
            }
        }
    }
}

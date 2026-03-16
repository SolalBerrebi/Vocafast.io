import SwiftUI

struct EnvironmentSwitcherView: View {
    @EnvironmentObject var appState: AppState
    @State private var showAddLanguage = false
    @State private var selectedNewLang: String?
    @State private var isAdding = false

    private var availableLanguages: [(code: String, flag: String, name: String)] {
        let existing = Set(appState.environments.map(\.targetLang))
        return Config.supportedLanguages.filter { !existing.contains($0.code) }
    }

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

            Divider()

            Button {
                showAddLanguage = true
            } label: {
                Label(L("env_add_language"), systemImage: "plus.circle")
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
                    Text(L("env_no_language"))
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
        .sheet(isPresented: $showAddLanguage) {
            NavigationStack {
                List {
                    ForEach(availableLanguages, id: \.code) { lang in
                        Button {
                            selectedNewLang = lang.code
                        } label: {
                            HStack {
                                Text(lang.flag)
                                Text(lang.name)
                                    .foregroundStyle(.primary)
                                Spacer()
                                if selectedNewLang == lang.code {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(Color.accentColor)
                                }
                            }
                        }
                    }
                }
                .navigationTitle(L("env_add_language"))
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(L("common_cancel")) {
                            showAddLanguage = false
                            selectedNewLang = nil
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(L("common_add")) {
                            Task {
                                guard let lang = selectedNewLang else { return }
                                isAdding = true
                                let envRepo = EnvironmentRepository()
                                let flag = Config.languageFlag(for: lang)
                                _ = try? await envRepo.create(targetLang: lang, color: "#007AFF", icon: flag)
                                await appState.fetchEnvironments()
                                isAdding = false
                                showAddLanguage = false
                                selectedNewLang = nil
                                HapticsManager.success()
                            }
                        }
                        .disabled(selectedNewLang == nil || isAdding)
                    }
                }
            }
            .presentationDetents([.medium, .large])
        }
    }
}

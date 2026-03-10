import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = SettingsViewModel()

    var body: some View {
        List {
            // Account
            Section("Account") {
                HStack {
                    Text("Email")
                    Spacer()
                    Text(viewModel.email)
                        .foregroundStyle(.secondary)
                }

                Button("Change Password") {
                    viewModel.showChangePassword = true
                }
            }

            // Languages
            LanguageManagementSection(viewModel: viewModel)

            // Import & Export
            ImportExportSection(viewModel: viewModel)

            // Notifications
            NotificationSettingsSection(viewModel: viewModel)

            // Messages
            if let success = viewModel.successMessage {
                Section {
                    Text(success)
                        .foregroundStyle(.green)
                }
            }

            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                }
            }

            // Sign Out
            Section {
                Button("Sign Out", role: .destructive) {
                    Task { await viewModel.signOut() }
                }
            }
        }
        .navigationTitle("Settings")
        .sheet(isPresented: $viewModel.showChangePassword) {
            ChangePasswordSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showAddLanguage) {
            AddLanguageSheet(viewModel: viewModel)
        }
        .confirmationDialog(
            "Delete Language",
            isPresented: $viewModel.showDeleteLanguage,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                Task { await viewModel.deleteLanguage(appState: appState) }
            }
        } message: {
            Text("This will permanently delete all decks, words, and training history for this language.")
        }
        .task {
            await viewModel.load()
        }
    }
}

// MARK: - Change Password Sheet

private struct ChangePasswordSheet: View {
    @ObservedObject var viewModel: SettingsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if let error = viewModel.errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }

                Section {
                    SecureField("New Password", text: $viewModel.newPassword)
                        .textContentType(.newPassword)
                    SecureField("Confirm Password", text: $viewModel.confirmPassword)
                        .textContentType(.newPassword)
                }
            }
            .navigationTitle("Change Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await viewModel.changePassword() }
                    }
                    .disabled(viewModel.isLoading)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Add Language Sheet

private struct AddLanguageSheet: View {
    @ObservedObject var viewModel: SettingsViewModel
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss

    private var availableLanguages: [(code: String, flag: String, name: String)] {
        let existing = Set(appState.environments.map(\.targetLang))
        return Config.supportedLanguages.filter { !existing.contains($0.code) }
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(availableLanguages, id: \.code) { lang in
                    Button {
                        viewModel.selectedNewLang = lang.code
                    } label: {
                        HStack {
                            Text(lang.flag)
                            Text(lang.name)
                                .foregroundStyle(.primary)
                            Spacer()
                            if viewModel.selectedNewLang == lang.code {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.accentColor)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Add Language")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task { await viewModel.addLanguage(appState: appState) }
                    }
                    .disabled(viewModel.selectedNewLang == nil || viewModel.isLoading)
                }
            }
        }
    }
}

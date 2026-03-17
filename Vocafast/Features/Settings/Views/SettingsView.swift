import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = SettingsViewModel()

    var body: some View {
        List {
            // Languages (directly visible)
            LanguageManagementSection(viewModel: viewModel)

            // Import & Export (directly visible)
            ImportExportSection(viewModel: viewModel)

            // Downloads (directly visible)
            Section(L("settings_downloads")) {
                NavigationLink {
                    DownloadedDecksView()
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "arrow.down.circle")
                            .foregroundStyle(Color.accentColor)
                        Text(L("settings_manage_downloads"))
                    }
                }
            }

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

            // Account, Notifications, About
            Section {
                NavigationLink {
                    AccountSubPage(viewModel: viewModel)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .foregroundStyle(Color.accentColor)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(L("settings_account"))
                                .foregroundStyle(.primary)
                            Text(viewModel.email)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                NavigationLink {
                    NotificationsSubPage(viewModel: viewModel)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "bell.fill")
                            .foregroundStyle(.orange)
                        Text(L("settings_notifications"))
                    }
                }

                NavigationLink {
                    AboutSubPage()
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "info.circle.fill")
                            .foregroundStyle(.secondary)
                        Text(L("settings_about"))
                    }
                }
            }
        }
        .navigationTitle(L("settings_title"))
        .sheet(isPresented: $viewModel.showAddLanguage) {
            AddLanguageSheet(viewModel: viewModel)
        }
        .confirmationDialog(
            L("settings_delete_lang_title"),
            isPresented: $viewModel.showDeleteLanguage,
            titleVisibility: .visible
        ) {
            Button(L("common_delete"), role: .destructive) {
                Task { await viewModel.deleteLanguage(appState: appState) }
            }
        } message: {
            Text(L("settings_delete_lang_message"))
        }
        .task {
            await viewModel.load()
        }
    }
}

// MARK: - Account Sub-Page

private struct AccountSubPage: View {
    @ObservedObject var viewModel: SettingsViewModel

    var body: some View {
        List {
            Section {
                HStack {
                    Text(L("settings_email"))
                    Spacer()
                    Text(viewModel.email)
                        .foregroundStyle(.secondary)
                }

                Button(L("settings_change_email")) {
                    viewModel.showChangeEmail = true
                }

                Button(L("settings_change_password")) {
                    viewModel.showChangePassword = true
                }
            }

            Section {
                Button(L("settings_sign_out"), role: .destructive) {
                    Task { await viewModel.signOut() }
                }
            }

            Section {
                Button(L("settings_delete_account"), role: .destructive) {
                    viewModel.showDeleteAccount = true
                }
            } footer: {
                Text(L("settings_delete_account_footer"))
            }
        }
        .navigationTitle(L("settings_account"))
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $viewModel.showChangeEmail) {
            ChangeEmailSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showChangePassword) {
            ChangePasswordSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showDeleteAccount) {
            DeleteAccountSheet(viewModel: viewModel)
        }
    }
}

// MARK: - Notifications Sub-Page

private struct NotificationsSubPage: View {
    @ObservedObject var viewModel: SettingsViewModel

    var body: some View {
        List {
            NotificationSettingsSection(viewModel: viewModel)
        }
        .navigationTitle(L("settings_notifications"))
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - About Sub-Page

private struct AboutSubPage: View {
    var body: some View {
        List {
            Section {
                Link(L("settings_privacy"), destination: URL(string: "https://vocafast-io.com/privacy")!)

                NavigationLink(L("settings_ai_data")) {
                    AIDataUsageView()
                }
            }

            Section {
                HStack {
                    Text(L("settings_version"))
                    Spacer()
                    Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle(L("settings_about"))
        .navigationBarTitleDisplayMode(.inline)
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
                    SecureField(L("auth_new_password"), text: $viewModel.newPassword)
                        .textContentType(.newPassword)
                    SecureField(L("auth_confirm_password"), text: $viewModel.confirmPassword)
                        .textContentType(.newPassword)
                }
            }
            .navigationTitle(L("settings_change_password"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L("common_cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L("common_save")) {
                        Task { await viewModel.changePassword() }
                    }
                    .disabled(viewModel.isLoading)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Change Email Sheet

private struct ChangeEmailSheet: View {
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
                    TextField(L("settings_new_email"), text: $viewModel.newEmail)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                } footer: {
                    Text(L("settings_change_email_hint"))
                }
            }
            .navigationTitle(L("settings_change_email"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L("common_cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L("common_save")) {
                        Task { await viewModel.changeEmail() }
                    }
                    .disabled(viewModel.isLoading || viewModel.newEmail.isEmpty)
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
                                    .foregroundStyle(Color.accentColor)
                            }
                        }
                    }
                }
            }
            .navigationTitle(L("settings_add_language"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L("common_cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L("common_add")) {
                        Task { await viewModel.addLanguage(appState: appState) }
                    }
                    .disabled(viewModel.selectedNewLang == nil || viewModel.isLoading)
                }
            }
        }
    }
}

import SwiftUI

struct DeleteAccountSheet: View {
    @ObservedObject var viewModel: SettingsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(L("delete_account_warning"))
                        .foregroundStyle(.secondary)
                }

                if let error = viewModel.errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }

                Section {
                    TextField(L("delete_account_confirm_placeholder"), text: $viewModel.deleteConfirmText)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                }

                Section {
                    Button(L("delete_account_button"), role: .destructive) {
                        Task { await viewModel.deleteAccount() }
                    }
                    .disabled(
                        viewModel.deleteConfirmText.lowercased() != "delete"
                        || viewModel.isDeletingAccount
                    )

                    if viewModel.isDeletingAccount {
                        HStack {
                            Spacer()
                            ProgressView(L("delete_account_deleting"))
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle(L("settings_delete_account"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L("common_cancel")) {
                        viewModel.deleteConfirmText = ""
                        viewModel.errorMessage = nil
                        dismiss()
                    }
                    .disabled(viewModel.isDeletingAccount)
                }
            }
            .interactiveDismissDisabled(viewModel.isDeletingAccount)
        }
    }
}

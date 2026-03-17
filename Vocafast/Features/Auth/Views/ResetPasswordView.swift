import SwiftUI

struct ResetPasswordView: View {
    @StateObject private var viewModel = AuthViewModel()
    @EnvironmentObject var appState: AppState
    @State private var showSuccess = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Text(L("auth_set_new_password"))
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .padding(.top, 40)
                    .padding(.bottom, 24)

                if showSuccess {
                    VStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .fill(Color.green.opacity(0.1))
                                .frame(width: 80, height: 80)
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(.green)
                        }

                        VStack(spacing: 8) {
                            Text(L("auth_password_updated"))
                                .font(.title2.bold())

                            Text(L("auth_password_updated_desc"))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 20)
                } else {
                    // Error
                    if let error = viewModel.errorMessage {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.subheadline)
                            Text(error)
                                .font(.callout)
                        }
                        .foregroundStyle(.white)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.85))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .padding(.horizontal, 24)
                        .padding(.bottom, 16)
                    }

                    // Password fields
                    VStack(spacing: 0) {
                        SecureField(L("auth_new_password"), text: $viewModel.password)
                            .textContentType(.newPassword)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 13)

                        Divider()
                            .padding(.leading, 14)

                        SecureField(L("auth_confirm_password"), text: $viewModel.confirmPassword)
                            .textContentType(.newPassword)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 13)
                    }
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding(.horizontal, 24)

                    Button {
                        Task {
                            await viewModel.updatePassword()
                            if viewModel.errorMessage == nil {
                                showSuccess = true
                            }
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text(L("auth_update_password"))
                            }
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .foregroundStyle(.white)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .disabled(viewModel.isLoading)
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Color(.systemGroupedBackground))
    }
}

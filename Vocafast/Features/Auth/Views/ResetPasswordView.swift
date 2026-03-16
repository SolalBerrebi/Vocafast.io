import SwiftUI

struct ResetPasswordView: View {
    @StateObject private var viewModel = AuthViewModel()
    @EnvironmentObject var appState: AppState
    @State private var showSuccess = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 60)

                Text(L("auth_set_new_password"))
                    .font(.largeTitle.bold())

                if showSuccess {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(.green)

                        Text(L("auth_password_updated"))
                            .font(.title2.bold())

                        Text(L("auth_password_updated_desc"))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 40)
                } else {
                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.callout)
                            .foregroundStyle(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.9))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(spacing: 16) {
                        SecureField(L("auth_new_password"), text: $viewModel.password)
                            .textContentType(.newPassword)
                            .textFieldStyle(.roundedBorder)

                        SecureField(L("auth_confirm_password"), text: $viewModel.confirmPassword)
                            .textContentType(.newPassword)
                            .textFieldStyle(.roundedBorder)
                    }

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
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .padding(.horizontal, 24)
        }
    }
}

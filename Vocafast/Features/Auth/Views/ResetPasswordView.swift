import SwiftUI

struct ResetPasswordView: View {
    @StateObject private var viewModel = AuthViewModel()
    @EnvironmentObject var appState: AppState
    @State private var showSuccess = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 60)

                Text("Set New Password")
                    .font(.largeTitle.bold())

                if showSuccess {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(.green)

                        Text("Password Updated")
                            .font(.title2.bold())

                        Text("Your password has been updated successfully.")
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
                        SecureField("New Password", text: $viewModel.password)
                            .textContentType(.newPassword)
                            .textFieldStyle(.roundedBorder)

                        SecureField("Confirm Password", text: $viewModel.confirmPassword)
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
                                Text("Update Password")
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

import SwiftUI

struct ForgotPasswordView: View {
    @StateObject private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 60)

                Text(L("auth_reset_password"))
                    .font(.largeTitle.bold())

                if viewModel.showSignupSuccess {
                    VStack(spacing: 16) {
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(Color.accentColor)

                        Text(L("auth_check_email"))
                            .font(.title2.bold())

                        Text(LF("auth_reset_sent", viewModel.email))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)

                        Button(L("auth_back_to_login")) {
                            dismiss()
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .foregroundStyle(.white)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.top, 40)
                } else {
                    Text(L("auth_reset_desc"))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.callout)
                            .foregroundStyle(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.9))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    TextField(L("auth_email"), text: $viewModel.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    Button {
                        Task { await viewModel.resetPassword() }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text(L("auth_send_reset_link"))
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

                    Button(L("auth_back_to_login")) {
                        dismiss()
                    }
                    .font(.subheadline)
                }
            }
            .padding(.horizontal, 24)
        }
    }
}

import SwiftUI

struct SignupView: View {
    @StateObject private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 40)

                Text(L("auth_create_account"))
                    .font(.largeTitle.bold())

                if viewModel.showSignupSuccess {
                    // Email confirmation state
                    VStack(spacing: 16) {
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(Color.accentColor)

                        Text(L("auth_check_email"))
                            .font(.title2.bold())

                        Text(LF("auth_confirm_sent", viewModel.email))
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
                    // Error banner
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
                        TextField(L("auth_display_name"), text: $viewModel.displayName)
                            .textContentType(.name)
                            .textFieldStyle(.roundedBorder)

                        TextField(L("auth_email"), text: $viewModel.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .textFieldStyle(.roundedBorder)

                        SecureField(L("auth_password"), text: $viewModel.password)
                            .textContentType(.newPassword)
                            .textFieldStyle(.roundedBorder)
                    }

                    Button {
                        Task { await viewModel.signUp() }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text(L("auth_sign_up"))
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

                    HStack {
                        Text(L("auth_has_account"))
                            .foregroundStyle(.secondary)
                        Button(L("auth_sign_in")) {
                            dismiss()
                        }
                        .fontWeight(.semibold)
                    }
                    .font(.subheadline)
                }
            }
            .padding(.horizontal, 24)
        }
        .onTapGesture {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
    }
}

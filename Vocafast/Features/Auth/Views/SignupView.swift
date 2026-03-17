import SwiftUI
import AuthenticationServices

struct SignupView: View {
    @StateObject private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // MARK: - Header
                VStack(spacing: 4) {
                    Text(L("auth_create_account"))
                        .font(.system(size: 28, weight: .bold, design: .rounded))

                    Text(L("auth_create_subtitle"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 40)
                .padding(.bottom, 32)

                if viewModel.showSignupSuccess {
                    // MARK: - Email Confirmation
                    VStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .fill(Color.accentColor.opacity(0.1))
                                .frame(width: 80, height: 80)
                            Image(systemName: "envelope.badge.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(Color.accentColor)
                        }

                        VStack(spacing: 8) {
                            Text(L("auth_check_email"))
                                .font(.title2.bold())

                            Text(LF("auth_confirm_sent", viewModel.email))
                                .font(.subheadline)
                                .multilineTextAlignment(.center)
                                .foregroundStyle(.secondary)
                        }

                        Button {
                            dismiss()
                        } label: {
                            Text(L("auth_back_to_login"))
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .foregroundStyle(.white)
                                .background(Color.accentColor)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 20)
                } else {
                    // MARK: - Error Banner
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

                    // MARK: - Social Sign-In
                    VStack(spacing: 12) {
                        SignInWithAppleButton(.continue) { request in
                            request.requestedScopes = [.email, .fullName]
                        } onCompletion: { result in
                            viewModel.handleAppleSignIn(result: result)
                        }
                        .signInWithAppleButtonStyle(.black)
                        .frame(height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                        Button {
                            Task { await viewModel.signInWithGoogle() }
                        } label: {
                            HStack(spacing: 6) {
                                GoogleLogo()
                                    .frame(width: 18, height: 18)
                                Text(L("auth_continue_google"))
                                    .font(.system(size: 16, weight: .medium))
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .foregroundStyle(.primary)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(Color(.systemBackground))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color(.separator), lineWidth: 0.5)
                            )
                        }
                    }
                    .padding(.horizontal, 24)

                    // MARK: - Divider
                    HStack(spacing: 16) {
                        Rectangle()
                            .fill(Color(.separator))
                            .frame(height: 0.5)
                        Text(L("auth_or"))
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                        Rectangle()
                            .fill(Color(.separator))
                            .frame(height: 0.5)
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 24)

                    // MARK: - Form Fields
                    VStack(spacing: 0) {
                        TextField(L("auth_display_name"), text: $viewModel.displayName)
                            .textContentType(.name)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 13)

                        Divider()
                            .padding(.leading, 14)

                        TextField(L("auth_email"), text: $viewModel.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 13)

                        Divider()
                            .padding(.leading, 14)

                        SecureField(L("auth_password"), text: $viewModel.password)
                            .textContentType(.newPassword)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 13)
                    }
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding(.horizontal, 24)

                    // MARK: - Sign Up Button
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
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .disabled(viewModel.isLoading)
                    .padding(.horizontal, 24)
                    .padding(.top, 16)

                    // MARK: - Sign In Link
                    HStack(spacing: 4) {
                        Text(L("auth_has_account"))
                            .foregroundStyle(.secondary)
                        Button(L("auth_sign_in")) {
                            dismiss()
                        }
                        .fontWeight(.semibold)
                    }
                    .font(.subheadline)
                    .padding(.top, 20)
                    .padding(.bottom, 24)
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Color(.systemGroupedBackground))
    }
}

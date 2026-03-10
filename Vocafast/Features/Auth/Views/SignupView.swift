import SwiftUI

struct SignupView: View {
    @StateObject private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 40)

                Text("Create Account")
                    .font(.largeTitle.bold())

                if viewModel.showSignupSuccess {
                    // Email confirmation state
                    VStack(spacing: 16) {
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(.accentColor)

                        Text("Check your email")
                            .font(.title2.bold())

                        Text("We've sent a confirmation link to \(viewModel.email). Please click it to activate your account.")
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)

                        Button("Back to Login") {
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
                        TextField("Display Name", text: $viewModel.displayName)
                            .textContentType(.name)
                            .textFieldStyle(.roundedBorder)

                        TextField("Email", text: $viewModel.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .textFieldStyle(.roundedBorder)

                        SecureField("Password", text: $viewModel.password)
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
                                Text("Sign Up")
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
                        Text("Already have an account?")
                            .foregroundStyle(.secondary)
                        Button("Sign In") {
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

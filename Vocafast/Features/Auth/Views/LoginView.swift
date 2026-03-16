import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var showForgotPassword = false
    @State private var showSignup = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 60)

                // Logo / Title
                VStack(spacing: 8) {
                    Text(L("auth_app_name"))
                        .font(.largeTitle.bold())
                    Text(L("auth_tagline"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer().frame(height: 20)

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

                // Form fields
                VStack(spacing: 16) {
                    TextField(L("auth_email"), text: $viewModel.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField(L("auth_password"), text: $viewModel.password)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)
                }

                // Sign In button
                Button {
                    Task { await viewModel.signIn() }
                } label: {
                    Group {
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text(L("auth_sign_in"))
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

                // Forgot Password
                Button(L("auth_forgot_password")) {
                    showForgotPassword = true
                }
                .font(.subheadline)

                Divider()

                // Sign Up link
                HStack {
                    Text(L("auth_no_account"))
                        .foregroundStyle(.secondary)
                    Button(L("auth_sign_up")) {
                        showSignup = true
                    }
                    .fontWeight(.semibold)
                }
                .font(.subheadline)
            }
            .padding(.horizontal, 24)
        }
        .navigationDestination(isPresented: $showForgotPassword) {
            ForgotPasswordView()
        }
        .navigationDestination(isPresented: $showSignup) {
            SignupView()
        }
        .onTapGesture {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
    }
}

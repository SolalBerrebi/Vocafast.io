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
                    Text("Vocafast")
                        .font(.largeTitle.bold())
                    Text("Learn vocabulary, fast.")
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
                    TextField("Email", text: $viewModel.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Password", text: $viewModel.password)
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
                            Text("Sign In")
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
                Button("Forgot Password?") {
                    showForgotPassword = true
                }
                .font(.subheadline)

                Divider()

                // Sign Up link
                HStack {
                    Text("Don't have an account?")
                        .foregroundStyle(.secondary)
                    Button("Sign Up") {
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

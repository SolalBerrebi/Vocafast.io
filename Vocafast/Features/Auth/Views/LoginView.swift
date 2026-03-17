import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var showForgotPassword = false
    @State private var showSignup = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // MARK: - Branding
                VStack(spacing: 12) {
                    if let icon = UIImage(named: "AppIcon") {
                        Image(uiImage: icon)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 80, height: 80)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            .shadow(color: .black.opacity(0.08), radius: 8, y: 4)
                    }

                    VStack(spacing: 4) {
                        Text(L("auth_app_name"))
                            .font(.system(size: 28, weight: .bold, design: .rounded))

                        Text(L("auth_tagline"))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.top, 56)
                .padding(.bottom, 36)

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
                    // Apple Sign-In
                    SignInWithAppleButton(.continue) { request in
                        request.requestedScopes = [.email, .fullName]
                    } onCompletion: { result in
                        viewModel.handleAppleSignIn(result: result)
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 50)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    // Google Sign-In
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

                // MARK: - Email / Password Fields
                VStack(spacing: 0) {
                    TextField(L("auth_email"), text: $viewModel.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 13)

                    Divider()
                        .padding(.leading, 14)

                    SecureField(L("auth_password"), text: $viewModel.password)
                        .textContentType(.password)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 13)
                }
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .padding(.horizontal, 24)

                // MARK: - Sign In Button
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
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .disabled(viewModel.isLoading)
                .padding(.horizontal, 24)
                .padding(.top, 16)

                // MARK: - Forgot Password
                Button(L("auth_forgot_password")) {
                    showForgotPassword = true
                }
                .font(.subheadline)
                .padding(.top, 12)

                // MARK: - Sign Up Link
                HStack(spacing: 4) {
                    Text(L("auth_no_account"))
                        .foregroundStyle(.secondary)
                    Button(L("auth_sign_up")) {
                        showSignup = true
                    }
                    .fontWeight(.semibold)
                }
                .font(.subheadline)
                .padding(.top, 28)
                .padding(.bottom, 24)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Color(.systemGroupedBackground))
        .navigationDestination(isPresented: $showForgotPassword) {
            ForgotPasswordView()
        }
        .navigationDestination(isPresented: $showSignup) {
            SignupView()
        }
    }
}

// MARK: - Google Logo (drawn with SwiftUI)

struct GoogleLogo: View {
    var body: some View {
        Canvas { context, size in
            let w = size.width
            let h = size.height
            let cx = w / 2
            let cy = h / 2
            let r = min(w, h) / 2 * 0.9

            // Blue arc (top-right)
            var blueArc = Path()
            blueArc.addArc(center: CGPoint(x: cx, y: cy), radius: r,
                           startAngle: .degrees(-45), endAngle: .degrees(-135), clockwise: true)
            blueArc.addLine(to: CGPoint(x: cx, y: cy))
            blueArc.closeSubpath()
            context.fill(blueArc, with: .color(Color(red: 0.26, green: 0.52, blue: 0.96)))

            // Red arc (top-left)
            var redArc = Path()
            redArc.addArc(center: CGPoint(x: cx, y: cy), radius: r,
                          startAngle: .degrees(-135), endAngle: .degrees(135), clockwise: true)
            redArc.addLine(to: CGPoint(x: cx, y: cy))
            redArc.closeSubpath()
            context.fill(redArc, with: .color(Color(red: 0.92, green: 0.26, blue: 0.21)))

            // Yellow arc (bottom-left)
            var yellowArc = Path()
            yellowArc.addArc(center: CGPoint(x: cx, y: cy), radius: r,
                             startAngle: .degrees(135), endAngle: .degrees(45), clockwise: true)
            yellowArc.addLine(to: CGPoint(x: cx, y: cy))
            yellowArc.closeSubpath()
            context.fill(yellowArc, with: .color(Color(red: 0.98, green: 0.74, blue: 0.02)))

            // Green arc (bottom-right)
            var greenArc = Path()
            greenArc.addArc(center: CGPoint(x: cx, y: cy), radius: r,
                            startAngle: .degrees(45), endAngle: .degrees(-45), clockwise: true)
            greenArc.addLine(to: CGPoint(x: cx, y: cy))
            greenArc.closeSubpath()
            context.fill(greenArc, with: .color(Color(red: 0.20, green: 0.66, blue: 0.33)))

            // White center circle
            let innerR = r * 0.55
            let whitePath = Path(ellipseIn: CGRect(x: cx - innerR, y: cy - innerR,
                                                    width: innerR * 2, height: innerR * 2))
            context.fill(whitePath, with: .color(.white))

            // White notch (right side opening)
            let notchRect = CGRect(x: cx, y: cy - innerR, width: r, height: innerR * 2)
            context.fill(Path(notchRect), with: .color(.white))

            // Blue horizontal bar (the "G" crossbar)
            let barH = r * 0.30
            let barRect = CGRect(x: cx - r * 0.05, y: cy - barH / 2, width: r * 0.95, height: barH)
            context.fill(Path(barRect), with: .color(Color(red: 0.26, green: 0.52, blue: 0.96)))
        }
    }
}

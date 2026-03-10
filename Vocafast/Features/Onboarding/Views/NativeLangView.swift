import SwiftUI

struct NativeLangView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @EnvironmentObject var appState: AppState
    @State private var showTargetLang = false

    var body: some View {
        VStack(spacing: 0) {
            // Step indicator
            StepIndicator(current: 1, total: 3)
                .padding(.top, 16)

            Text("What's your native language?")
                .font(.title2.bold())
                .padding(.top, 24)

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.callout)
                    .foregroundStyle(.red)
                    .padding(.top, 8)
            }

            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(Config.supportedLanguages, id: \.code) { lang in
                        Button {
                            viewModel.selectedNativeLang = lang.code
                            HapticsManager.selection()
                        } label: {
                            HStack {
                                Text(lang.flag)
                                    .font(.title2)
                                Text(lang.name)
                                    .foregroundStyle(.primary)
                                Spacer()
                                if viewModel.selectedNativeLang == lang.code {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.accentColor)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(viewModel.selectedNativeLang == lang.code ? Color.accentColor.opacity(0.1) : Color(.systemGray6))
                            )
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
            }

            // Continue button
            Button {
                Task {
                    if await viewModel.saveNativeLang() {
                        showTargetLang = true
                    }
                }
            } label: {
                Group {
                    if viewModel.isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Continue")
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .foregroundStyle(.white)
                .background(viewModel.selectedNativeLang != nil ? Color.accentColor : Color.gray)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(viewModel.selectedNativeLang == nil || viewModel.isLoading)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
        .navigationDestination(isPresented: $showTargetLang) {
            TargetLangView(nativeLang: viewModel.selectedNativeLang ?? "en")
        }
        .navigationBarBackButtonHidden(true)
    }
}

struct StepIndicator: View {
    let current: Int
    let total: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(1...total, id: \.self) { step in
                RoundedRectangle(cornerRadius: 4)
                    .fill(step <= current ? Color.accentColor : Color(.systemGray4))
                    .frame(height: 4)
            }
        }
        .padding(.horizontal, 24)
    }
}

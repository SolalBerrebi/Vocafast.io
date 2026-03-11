import SwiftUI

struct TargetLangView: View {
    let nativeLang: String
    @StateObject private var viewModel = OnboardingViewModel()
    @EnvironmentObject var appState: AppState
    @State private var showFirstDeck = false

    private var filteredLanguages: [(code: String, flag: String, name: String)] {
        Config.supportedLanguages.filter { $0.code != nativeLang }
    }

    var body: some View {
        VStack(spacing: 0) {
            StepIndicator(current: 2, total: 3)
                .padding(.top, 16)

            Text("What language do you want to learn?")
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
                    ForEach(filteredLanguages, id: \.code) { lang in
                        Button {
                            viewModel.selectedTargetLang = lang.code
                            HapticsManager.selection()
                        } label: {
                            HStack {
                                Text(lang.flag)
                                    .font(.title2)
                                Text(lang.name)
                                    .foregroundStyle(.primary)
                                Spacer()
                                if viewModel.selectedTargetLang == lang.code {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(Color.accentColor)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(viewModel.selectedTargetLang == lang.code ? Color.accentColor.opacity(0.1) : Color(.systemGray6))
                            )
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
            }

            Button {
                Task {
                    if await viewModel.saveTargetLang() {
                        showFirstDeck = true
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
                .background(viewModel.selectedTargetLang != nil ? Color.accentColor : Color.gray)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(viewModel.selectedTargetLang == nil || viewModel.isLoading)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
        .navigationDestination(isPresented: $showFirstDeck) {
            FirstDeckView()
        }
        .navigationBarBackButtonHidden(false)
    }
}

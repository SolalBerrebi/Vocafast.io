import SwiftUI

struct FirstDeckView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 0) {
            StepIndicator(current: 3, total: 3)
                .padding(.top, 16)

            Text(L("onboarding_first_deck"))
                .font(.title2.bold())
                .padding(.top, 24)

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.callout)
                    .foregroundStyle(.red)
                    .padding(.top, 8)
            }

            ScrollView {
                VStack(spacing: 20) {
                    // Preset topics
                    VStack(alignment: .leading, spacing: 12) {
                        Text(L("onboarding_choose_topic"))
                            .font(.headline)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(viewModel.presetTopics, id: \.0) { topic, icon in
                                Button {
                                    viewModel.selectedTopic = topic
                                    viewModel.deckName = ""
                                    HapticsManager.selection()
                                } label: {
                                    HStack {
                                        Text(icon)
                                        Text(topic)
                                            .foregroundStyle(.primary)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(viewModel.selectedTopic == topic ? Color.accentColor.opacity(0.1) : Color(.systemGray6))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(viewModel.selectedTopic == topic ? Color.accentColor : Color.clear, lineWidth: 2)
                                    )
                                }
                            }
                        }
                    }

                    // Or custom name
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("onboarding_custom_name"))
                            .font(.headline)

                        TextField(L("onboarding_custom_placeholder"), text: $viewModel.deckName)
                            .textFieldStyle(.roundedBorder)
                            .onChange(of: viewModel.deckName) { _, newValue in
                                if !newValue.isEmpty {
                                    viewModel.selectedTopic = nil
                                }
                            }
                    }

                    // Vocabulary level (only for preset topics)
                    if viewModel.selectedTopic != nil {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(L("onboarding_vocab_level"))
                                .font(.headline)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(viewModel.levels, id: \.0) { id, name in
                                        Button {
                                            viewModel.selectedLevel = id
                                        } label: {
                                            Text(name)
                                                .font(.subheadline)
                                                .padding(.horizontal, 16)
                                                .padding(.vertical, 8)
                                                .background(
                                                    RoundedRectangle(cornerRadius: 20)
                                                        .fill(viewModel.selectedLevel == id ? Color.accentColor : Color(.systemGray6))
                                                )
                                                .foregroundStyle(viewModel.selectedLevel == id ? .white : .primary)
                                        }
                                    }
                                }
                            }
                        }

                        // Word count slider
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(L("onboarding_word_count"))
                                    .font(.headline)
                                Spacer()
                                Text("\(Int(viewModel.wordCount))")
                                    .font(.headline)
                                    .foregroundStyle(Color.accentColor)
                            }

                            Slider(value: $viewModel.wordCount, in: 5...50, step: 1)
                                .tint(Color.accentColor)
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
            }

            // Create button
            Button {
                Task {
                    _ = await viewModel.createFirstDeck(appState: appState)
                }
            } label: {
                Group {
                    if viewModel.isLoading {
                        HStack(spacing: 8) {
                            ProgressView().tint(.white)
                            if viewModel.selectedTopic != nil {
                                Text(LF("onboarding_generating", Int(viewModel.wordCount)))
                                    .foregroundStyle(.white)
                            }
                        }
                    } else {
                        Text(L("onboarding_create_deck"))
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .foregroundStyle(.white)
                .background(hasSelection ? Color.accentColor : Color.gray)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(!hasSelection || viewModel.isLoading)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
        .navigationBarBackButtonHidden(false)
    }

    private var hasSelection: Bool {
        viewModel.selectedTopic != nil || !viewModel.deckName.isEmpty
    }
}

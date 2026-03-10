import SwiftUI

struct FirstDeckView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 0) {
            StepIndicator(current: 3, total: 3)
                .padding(.top, 16)

            Text("Create your first deck")
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
                        Text("Choose a topic")
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
                        Text("Or enter a custom name")
                            .font(.headline)

                        TextField("e.g. My Vocabulary", text: $viewModel.deckName)
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
                            Text("Vocabulary Level")
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
                                Text("Word Count")
                                    .font(.headline)
                                Spacer()
                                Text("\(Int(viewModel.wordCount))")
                                    .font(.headline)
                                    .foregroundStyle(.accentColor)
                            }

                            Slider(value: $viewModel.wordCount, in: 5...50, step: 1)
                                .tint(.accentColor)
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
                                Text("Generating \(Int(viewModel.wordCount)) words...")
                                    .foregroundStyle(.white)
                            }
                        }
                    } else {
                        Text("Create Deck")
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

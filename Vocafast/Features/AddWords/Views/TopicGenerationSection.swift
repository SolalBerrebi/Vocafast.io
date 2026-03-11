import SwiftUI
import UIKit

struct TopicGenerationSection: View {
    @ObservedObject var viewModel: AddWordsViewModel

    var body: some View {
        VStack(spacing: 16) {
            if viewModel.extractedWords.isEmpty {
                // Description
                VStack(alignment: .leading, spacing: 4) {
                    Text("Describe any topic and AI generates vocabulary instantly. The more specific, the better.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 16)

                // Custom topic input
                HStack {
                    TextField("e.g. cooking, animals, at the airport...", text: $viewModel.topicInput)
                        .textFieldStyle(.roundedBorder)

                    Button("Go") {
                        let topic = viewModel.topicInput.trimmingCharacters(in: .whitespaces)
                        guard !topic.isEmpty else { return }
                        Task { await viewModel.generateTopic(topic) }
                    }
                    .disabled(viewModel.topicInput.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isLoading)
                }
                .padding(.horizontal, 16)

                // Level selector
                VStack(alignment: .leading, spacing: 8) {
                    Text("Difficulty")
                        .font(.subheadline.weight(.semibold))

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(viewModel.levels, id: \.0) { id, name in
                                Button {
                                    viewModel.selectedLevel = id
                                } label: {
                                    Text(name)
                                        .font(.caption)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(
                                            Capsule()
                                                .fill(viewModel.selectedLevel == id ? Color.accentColor : Color(UIColor.systemGray6))
                                        )
                                        .foregroundStyle(viewModel.selectedLevel == id ? .white : .primary)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)

                // Word count slider
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Number of words")
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                        Text("\(Int(viewModel.topicWordCount))")
                            .fontWeight(.semibold)
                            .foregroundStyle(Color.accentColor)
                    }
                    Slider(value: $viewModel.topicWordCount, in: 5...50, step: 1)
                        .tint(Color.accentColor)
                }
                .padding(.horizontal, 16)

                // Quick topics grid
                VStack(alignment: .leading, spacing: 8) {
                    Text("Quick Topics")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 16)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(viewModel.quickTopics, id: \.0) { topic, icon in
                            Button {
                                Task { await viewModel.generateTopic(topic) }
                            } label: {
                                HStack {
                                    Text(icon)
                                    Text(topic)
                                        .font(.subheadline)
                                        .foregroundStyle(.primary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color(UIColor.systemGray6))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .disabled(viewModel.isLoading)
                        }
                    }
                    .padding(.horizontal, 16)
                }

                // Loading
                if viewModel.isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text(viewModel.loadingMessage)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 24)
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 16)
                }
            } else {
                // Results
                WordReviewList(
                    words: $viewModel.extractedWords,
                    onToggle: viewModel.toggleWordSelection
                )

                HStack(spacing: 12) {
                    Button("Back") {
                        viewModel.clearExtracted()
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color(UIColor.systemGray5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        Task { await viewModel.saveSelected(sourceType: .topic) }
                    } label: {
                        Text("Save Selected")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .foregroundStyle(.white)
                            .background(Color.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }
}

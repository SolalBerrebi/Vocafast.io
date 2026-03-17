import SwiftUI
import UIKit

struct TopicGenerationSection: View {
    @ObservedObject var viewModel: AddWordsViewModel

    var body: some View {
        VStack(spacing: 16) {
            if viewModel.extractedWords.isEmpty {
                // MARK: - Topic Input
                VStack(alignment: .leading, spacing: 10) {
                    Text(L("topic_desc"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 16)

                    // Text field in a card
                    TextField(L("topic_placeholder"), text: $viewModel.topicInput, axis: .vertical)
                        .lineLimit(2...4)
                        .font(.body)
                        .padding(14)
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .padding(.horizontal, 16)

                    // Generate button
                    Button {
                        let topic = viewModel.topicInput.trimmingCharacters(in: .whitespaces)
                        guard !topic.isEmpty else { return }
                        Task { await viewModel.generateTopic(topic) }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "sparkles")
                            Text(L("topic_generate"))
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .foregroundStyle(.white)
                        .background(
                            viewModel.topicInput.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isLoading
                                ? Color.gray : Color.accentColor
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .disabled(viewModel.topicInput.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isLoading)
                    .padding(.horizontal, 16)
                }

                // MARK: - Level + Word Count Card
                VStack(spacing: 14) {
                    // Level selector — 5-column grid, no scrolling
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("topic_difficulty"))
                            .font(.subheadline.weight(.semibold))

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: viewModel.levels.count), spacing: 0) {
                            ForEach(viewModel.levels, id: \.0) { id, name in
                                Button {
                                    viewModel.selectedLevel = id
                                    HapticsManager.selection()
                                } label: {
                                    Text(name)
                                        .font(.caption)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.7)
                                        .padding(.vertical, 8)
                                        .frame(maxWidth: .infinity)
                                        .background(
                                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                                .fill(viewModel.selectedLevel == id ? Color.accentColor : Color(.systemGray5))
                                        )
                                        .foregroundStyle(viewModel.selectedLevel == id ? .white : .primary)
                                }
                            }
                        }
                    }

                    Divider()

                    // Word count
                    HStack(spacing: 12) {
                        Text(L("topic_word_count"))
                            .font(.subheadline.weight(.semibold))
                        Slider(value: $viewModel.topicWordCount, in: 5...50, step: 1)
                            .tint(Color.accentColor)
                        Text("\(Int(viewModel.topicWordCount))")
                            .font(.subheadline.bold())
                            .foregroundStyle(Color.accentColor)
                            .frame(width: 28, alignment: .trailing)
                    }
                }
                .padding(14)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .padding(.horizontal, 16)

                // MARK: - Quick Topics
                VStack(alignment: .leading, spacing: 8) {
                    Text(L("topic_quick"))
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 16)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(viewModel.quickTopics, id: \.0) { topic, icon in
                            Button {
                                Task { await viewModel.generateTopic(topic) }
                            } label: {
                                HStack(spacing: 6) {
                                    Text(icon)
                                    Text(topic)
                                        .font(.subheadline)
                                        .foregroundStyle(.primary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color(.secondarySystemGroupedBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            }
                            .disabled(viewModel.isLoading)
                        }
                    }
                    .padding(.horizontal, 16)
                }

                // MARK: - Loading / Error
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
                // MARK: - Results
                WordReviewList(
                    words: $viewModel.extractedWords,
                    onToggle: viewModel.toggleWordSelection
                )

                HStack(spacing: 12) {
                    Button(L("common_back")) {
                        viewModel.clearExtracted()
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color(.systemGray5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        Task { await viewModel.saveSelected(sourceType: .topic) }
                    } label: {
                        Text(L("topic_save_selected"))
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

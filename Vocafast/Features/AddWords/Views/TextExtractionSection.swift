import SwiftUI
import UIKit

struct TextExtractionSection: View {
    @ObservedObject var viewModel: AddWordsViewModel

    var body: some View {
        VStack(spacing: 16) {
            if viewModel.extractedWords.isEmpty {
                // Description
                Text(L("text_desc"))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)

                VStack(spacing: 12) {
                    TextEditor(text: $viewModel.inputText)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color(UIColor.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            Group {
                                if viewModel.inputText.isEmpty {
                                    Text(L("text_placeholder"))
                                        .foregroundStyle(.tertiary)
                                        .padding(12)
                                        .allowsHitTesting(false)
                                }
                            },
                            alignment: .topLeading
                        )
                }
                .padding(.horizontal, 16)

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 16)
                }

                Button {
                    Task { await viewModel.extractFromText() }
                } label: {
                    Group {
                        if viewModel.isLoading {
                            HStack(spacing: 8) {
                                ProgressView().tint(.white)
                                Text(viewModel.loadingMessage)
                            }
                        } else {
                            Text(L("text_extract"))
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
                .padding(.horizontal, 16)
            } else {
                WordReviewList(
                    words: $viewModel.extractedWords,
                    onToggle: viewModel.toggleWordSelection
                )

                HStack(spacing: 12) {
                    Button(L("common_clear")) {
                        viewModel.clearExtracted()
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color(UIColor.systemGray5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        Task { await viewModel.saveSelected(sourceType: .text) }
                    } label: {
                        Text(L("text_save_selected"))
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

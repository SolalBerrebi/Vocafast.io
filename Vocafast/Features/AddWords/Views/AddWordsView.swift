import SwiftUI
import UIKit

struct AddWordsView: View {
    let deckId: UUID
    @StateObject private var viewModel: AddWordsViewModel
    @State private var selectedMethod: CaptureMethod? = nil

    enum CaptureMethod: Hashable {
        case topic, photo, text, manual
    }

    init(deckId: UUID) {
        self.deckId = deckId
        _viewModel = StateObject(wrappedValue: AddWordsViewModel(deckId: deckId))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 16) {
                    if selectedMethod == nil {
                        methodPicker
                    } else {
                        switch selectedMethod {
                        case .topic:
                            TopicGenerationSection(viewModel: viewModel)
                        case .photo:
                            PhotoCaptureSection(viewModel: viewModel)
                        case .text:
                            TextExtractionSection(viewModel: viewModel)
                        case .manual:
                            ManualEntrySection(viewModel: viewModel)
                        case .none:
                            EmptyView()
                        }
                    }

                    // Recently added
                    if !viewModel.recentlyAdded.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Recently Added")
                                .font(.headline)
                                .padding(.horizontal, 16)

                            ForEach(viewModel.recentlyAdded.prefix(10)) { word in
                                HStack {
                                    Text(word.word)
                                        .fontWeight(.medium)
                                    Spacer()
                                    Text(word.translation)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 6)
                            }
                        }
                        .padding(.top, 8)
                    }
                }
                .padding(.vertical, 16)
            }
        }
        .navigationTitle(selectedMethod == nil ? "Add Words" : methodTitle)
        .navigationBarBackButtonHidden(selectedMethod != nil)
        .toolbar {
            if selectedMethod != nil {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedMethod = nil
                            viewModel.clearExtracted()
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .fontWeight(.semibold)
                            Text("All Methods")
                        }
                    }
                }
            }
        }
        .task {
            await viewModel.loadExistingWords()
        }
    }

    private var methodTitle: String {
        switch selectedMethod {
        case .topic: return "AI Topic Generator"
        case .photo: return "Smart Photo Scan"
        case .text: return "Paste Text"
        case .manual: return "Type Manually"
        case .none: return "Add Words"
        }
    }

    // MARK: - Method Picker

    private var methodPicker: some View {
        VStack(spacing: 12) {
            // Subtitle
            Text("Choose how you want to add vocabulary. AI does the heavy lifting.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 4)

            // PRIMARY: Topic Generation
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    selectedMethod = .topic
                }
            } label: {
                HStack(alignment: .top, spacing: 14) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.blue)
                            .frame(width: 44, height: 44)
                        Image(systemName: "sparkles")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text("AI Topic Generator")
                                .font(.body.weight(.bold))
                                .foregroundStyle(.primary)
                            Text("FASTEST")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.blue)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        Text("Type any topic — \"cooking\", \"at the airport\", \"business meetings\" — and get instant vocabulary with translations.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.blue.opacity(0.06))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(Color.blue.opacity(0.15), lineWidth: 1.5)
                        )
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)

            // PRIMARY: Photo Scan
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    selectedMethod = .photo
                }
            } label: {
                HStack(alignment: .top, spacing: 14) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.orange)
                            .frame(width: 44, height: 44)
                        Image(systemName: "camera.fill")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text("Smart Photo Scan")
                                .font(.body.weight(.bold))
                                .foregroundStyle(.primary)
                            Text("MAGIC")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.orange)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.orange.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        Text("Snap a photo of a restaurant menu, street sign, textbook, or product label — AI extracts the vocabulary for you.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.orange.opacity(0.06))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(Color.orange.opacity(0.15), lineWidth: 1.5)
                        )
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)

            // SECONDARY ROW: Text + Manual
            HStack(spacing: 10) {
                // Paste Text
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedMethod = .text
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.green)
                                .frame(width: 36, height: 36)
                            Image(systemName: "doc.text")
                                .font(.body.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                        Text("Paste Text")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.primary)
                        Text("Paste a word list or paragraph")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                            .lineLimit(2)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(UIColor.systemBackground))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(Color(UIColor.separator), lineWidth: 0.5)
                            )
                    )
                }
                .buttonStyle(.plain)

                // Manual
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedMethod = .manual
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.purple)
                                .frame(width: 36, height: 36)
                            Image(systemName: "pencil.line")
                                .font(.body.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                        Text("Type Manually")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.primary)
                        Text("Add words one by one")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                            .lineLimit(2)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(UIColor.systemBackground))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(Color(UIColor.separator), lineWidth: 0.5)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)

            // Deck word count
            if !viewModel.existingWordCount.isEmpty {
                Text(viewModel.existingWordCount)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .padding(.top, 4)
            }
        }
    }
}

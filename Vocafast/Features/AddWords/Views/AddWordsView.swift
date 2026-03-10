import SwiftUI

struct AddWordsView: View {
    let deckId: UUID
    @StateObject private var viewModel: AddWordsViewModel
    @State private var selectedTab = 0

    init(deckId: UUID) {
        self.deckId = deckId
        _viewModel = StateObject(wrappedValue: AddWordsViewModel(deckId: deckId))
    }

    var body: some View {
        VStack(spacing: 0) {
            // Tab selector
            Picker("Method", selection: $selectedTab) {
                Text("Manual").tag(0)
                Text("Photo").tag(1)
                Text("Text").tag(2)
                Text("Topics").tag(3)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.top, 8)

            // Coach mark
            if viewModel.showCoachMark {
                CoachMarkView(text: "Add words using manual entry, photos, text, or AI topics!") {
                    withAnimation {
                        viewModel.showCoachMark = false
                        CoachMarkStore.dismiss("add_words")
                    }
                }
                .padding(.top, 8)
            }

            // Content
            ScrollView {
                VStack(spacing: 16) {
                    switch selectedTab {
                    case 0:
                        ManualEntrySection(viewModel: viewModel)
                    case 1:
                        PhotoCaptureSection(viewModel: viewModel)
                    case 2:
                        TextExtractionSection(viewModel: viewModel)
                    case 3:
                        TopicGenerationSection(viewModel: viewModel)
                    default:
                        EmptyView()
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
        .navigationTitle("Add Words")
        .task {
            await viewModel.loadExistingWords()
        }
    }
}

import SwiftUI

struct WordReviewList: View {
    @Binding var words: [ExtractedWord]
    let onToggle: (UUID) -> Void

    private var selectedCount: Int {
        words.filter(\.isSelected).count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("\(words.count) words found")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text("\(selectedCount) selected")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 16)

            ForEach(words) { word in
                HStack {
                    Image(systemName: word.isSelected ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(word.isSelected ? Color.accentColor : .secondary)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(word.word)
                            .font(.body.weight(.medium))
                        Text(word.translation)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        if let context = word.context, !context.isEmpty {
                            Text(context)
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                                .italic()
                        }
                    }

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .contentShape(Rectangle())
                .onTapGesture {
                    onToggle(word.id)
                    HapticsManager.selection()
                }
            }
        }
    }
}

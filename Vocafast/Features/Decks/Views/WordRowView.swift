import SwiftUI

struct WordRowView: View {
    let word: Word

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(word.word)
                    .font(.body.weight(.medium))
                Text(word.translation)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let context = word.contextSentence, !context.isEmpty {
                    Text(context)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
            }
            Spacer()

            // SRS indicator
            Circle()
                .fill(srsColor)
                .frame(width: 8, height: 8)
        }
        .padding(.vertical, 4)
    }

    private var srsColor: Color {
        if word.repetitions == 0 {
            return .blue // New
        } else if word.intervalDays >= 21 {
            return .green // Mastered
        } else if word.easeFactor < 2.2 {
            return .orange // Struggling
        } else {
            return .yellow // Learning
        }
    }
}

import SwiftUI

struct DeckCardView: View {
    let deck: Deck

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Text(deck.icon)
                .font(.title)
                .frame(width: 48, height: 48)
                .background(Color(hex: deck.color).opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 4) {
                Text(deck.name)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Text("\(deck.wordCount) word\(deck.wordCount == 1 ? "" : "s")")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
        )
    }
}

import SwiftUI

struct FlashCardView: View {
    let card: TrainingCard
    let frontSide: CardFrontSide
    let onAgain: () -> Void
    let onHard: () -> Void
    let onGood: () -> Void

    @State private var isFlipped = false
    @State private var rotation: Double = 0

    private var frontText: String {
        frontSide == .word ? card.word.word : card.word.translation
    }

    private var backText: String {
        frontSide == .word ? card.word.translation : card.word.word
    }

    var body: some View {
        VStack(spacing: 24) {
            // Card
            ZStack {
                // Back
                cardFace(text: backText, isBack: true)
                    .rotation3DEffect(.degrees(rotation + 180), axis: (x: 0, y: 1, z: 0))
                    .opacity(isFlipped ? 1 : 0)

                // Front
                cardFace(text: frontText, isBack: false)
                    .rotation3DEffect(.degrees(rotation), axis: (x: 0, y: 1, z: 0))
                    .opacity(isFlipped ? 0 : 1)
            }
            .onTapGesture {
                withAnimation(.easeInOut(duration: 0.4)) {
                    rotation += 180
                    isFlipped.toggle()
                }
                HapticsManager.light()
            }

            if !isFlipped {
                Text("Tap to reveal")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            // Answer buttons (shown after flip)
            if isFlipped {
                HStack(spacing: 12) {
                    Button {
                        resetAndAnswer(action: onAgain)
                    } label: {
                        Text("Again")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .foregroundStyle(.white)
                            .background(Color.red)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        resetAndAnswer(action: onHard)
                    } label: {
                        Text("Hard")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .foregroundStyle(.white)
                            .background(Color.orange)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        resetAndAnswer(action: onGood)
                    } label: {
                        Text("Good")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .foregroundStyle(.white)
                            .background(Color.green)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 20)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(.horizontal, 20)
        .onChange(of: card.id) { _, _ in
            isFlipped = false
            rotation = 0
        }
    }

    private func cardFace(text: String, isBack: Bool) -> some View {
        VStack {
            Spacer()
            Text(text)
                .font(.title.bold())
                .multilineTextAlignment(.center)
                .padding(24)
            if let context = card.word.contextSentence, !context.isEmpty, isBack {
                Text(context)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .frame(height: 220)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 12, y: 4)
        )
    }

    private func resetAndAnswer(action: () -> Void) {
        action()
        isFlipped = false
        rotation = 0
    }
}

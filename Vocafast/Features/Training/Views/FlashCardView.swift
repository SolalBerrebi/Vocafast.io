import SwiftUI

struct FlashCardView: View {
    let card: TrainingCard
    let frontSide: CardFrontSide
    let targetLang: String
    let nativeLang: String
    let onAgain: () -> Void
    let onHard: () -> Void
    let onGood: () -> Void

    @State private var isFlipped = false
    @State private var rotation: Double = 0
    @State private var showHint = false
    @State private var cardOffset: CGFloat = 0
    @State private var cardOpacity: Double = 1

    private var frontText: String {
        frontSide == .word ? card.word.word : card.word.translation
    }

    private var backText: String {
        frontSide == .word ? card.word.translation : card.word.word
    }

    private var frontLang: String {
        frontSide == .word ? targetLang : nativeLang
    }

    private var backLang: String {
        frontSide == .word ? nativeLang : targetLang
    }

    private var hasHint: Bool {
        if let context = card.word.contextSentence, !context.isEmpty {
            return true
        }
        return false
    }

    var body: some View {
        VStack(spacing: 20) {
            // Card
            ZStack {
                // Back
                cardFace(text: backText, language: backLang, isBack: true)
                    .rotation3DEffect(.degrees(rotation + 180), axis: (x: 0, y: 1, z: 0))
                    .opacity(isFlipped ? 1 : 0)

                // Front
                cardFace(text: frontText, language: frontLang, isBack: false)
                    .rotation3DEffect(.degrees(rotation), axis: (x: 0, y: 1, z: 0))
                    .opacity(isFlipped ? 0 : 1)
            }
            .offset(x: cardOffset)
            .opacity(cardOpacity)
            .onTapGesture {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                    rotation += 180
                    isFlipped.toggle()
                    showHint = false
                }
                HapticsManager.light()
            }

            // Hint / Tap to reveal area
            if !isFlipped {
                VStack(spacing: 12) {
                    Text(L("session_tap_reveal"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    // Hint button
                    if hasHint {
                        if showHint {
                            Text(card.word.contextSentence ?? "")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                                .transition(.opacity.combined(with: .scale(scale: 0.95)))
                        } else {
                            Button {
                                withAnimation(.easeOut(duration: 0.2)) {
                                    showHint = true
                                }
                                HapticsManager.light()
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "lightbulb.fill")
                                        .font(.caption)
                                    Text(L("session_hint"))
                                        .font(.caption.weight(.medium))
                                }
                                .foregroundStyle(.orange)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(
                                    Capsule()
                                        .fill(Color.orange.opacity(0.12))
                                )
                            }
                        }
                    }
                }
            }

            // Answer buttons (shown after flip)
            if isFlipped {
                HStack(spacing: 12) {
                    answerButton(label: L("session_again"), color: .red) {
                        animateOutAndAnswer(action: onAgain)
                    }
                    answerButton(label: L("session_hard"), color: .orange) {
                        animateOutAndAnswer(action: onHard)
                    }
                    answerButton(label: L("session_good"), color: .green) {
                        animateOutAndAnswer(action: onGood)
                    }
                }
                .padding(.horizontal, 20)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(.horizontal, 20)
        .onChange(of: card.id) { _, _ in
            // Animate new card in
            cardOffset = 40
            cardOpacity = 0
            isFlipped = false
            rotation = 0
            showHint = false
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                cardOffset = 0
                cardOpacity = 1
            }
        }
    }

    // MARK: - Card Face

    private func cardFace(text: String, language: String, isBack: Bool) -> some View {
        VStack(spacing: 12) {
            Spacer()
            Text(text)
                .font(.title.bold())
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            PronounceButton(text: text, language: language, size: 32, iconSize: .subheadline)
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
        .frame(height: 240)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 6)
        )
    }

    // MARK: - Answer Button

    private func answerButton(label: String, color: Color, action: @escaping () -> Void) -> some View {
        Button {
            action()
        } label: {
            Text(label)
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .foregroundStyle(.white)
                .background(color)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Transition

    private func animateOutAndAnswer(action: () -> Void) {
        // Slide card out to the left
        withAnimation(.easeIn(duration: 0.15)) {
            cardOffset = -60
            cardOpacity = 0
        }
        // Fire answer (advances index, triggers DB in background)
        action()
    }
}

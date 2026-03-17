import SwiftUI

struct TypingChallengeView: View {
    let card: TrainingCard
    let targetLang: String
    let onAnswer: (String) -> Void

    @State private var typedAnswer = ""
    @State private var showResult = false
    @State private var wasCorrect = false
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 24) {
            // Word display with pronunciation
            VStack(spacing: 8) {
                HStack(spacing: 10) {
                    Text(card.word.word)
                        .font(.title.bold())
                        .multilineTextAlignment(.center)

                    PronounceButton(
                        text: card.word.word,
                        language: targetLang,
                        size: 36,
                        iconSize: .body
                    )
                }

                if let context = card.word.contextSentence, !context.isEmpty {
                    Text(context)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 20)

            if showResult {
                // Result display
                VStack(spacing: 12) {
                    Image(systemName: wasCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(wasCorrect ? .green : .red)

                    if !wasCorrect {
                        VStack(spacing: 4) {
                            Text(LF("session_your_answer", typedAnswer))
                                .foregroundStyle(.red)
                            Text(LF("session_correct_answer", card.word.translation))
                                .foregroundStyle(.green)
                                .fontWeight(.semibold)
                        }
                    } else {
                        Text(card.word.translation)
                            .foregroundStyle(.green)
                            .fontWeight(.semibold)
                    }
                }
                .transition(.scale.combined(with: .opacity))
            } else {
                // Input
                TextField(L("session_type_placeholder"), text: $typedAnswer)
                    .textFieldStyle(.roundedBorder)
                    .font(.body)
                    .autocapitalization(.none)
                    .focused($isFocused)
                    .padding(.horizontal, 20)
                    .onSubmit {
                        checkAnswer()
                    }

                Button {
                    checkAnswer()
                } label: {
                    Text(L("session_check"))
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .foregroundStyle(.white)
                        .background(typedAnswer.isEmpty ? Color.gray : Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(typedAnswer.trimmingCharacters(in: .whitespaces).isEmpty)
                .padding(.horizontal, 20)
            }
        }
        .onAppear {
            isFocused = true
            SpeechService.shared.speak(card.word.word, language: targetLang)
        }
        .onChange(of: card.id) { _, _ in
            typedAnswer = ""
            showResult = false
            wasCorrect = false
            isFocused = true
            SpeechService.shared.speak(card.word.word, language: targetLang)
        }
    }

    private func checkAnswer() {
        wasCorrect = SRSEngine.isFuzzyMatch(typed: typedAnswer, correct: card.word.translation)
        showResult = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            onAnswer(typedAnswer)
            typedAnswer = ""
            showResult = false
            wasCorrect = false
            isFocused = true
        }
    }
}

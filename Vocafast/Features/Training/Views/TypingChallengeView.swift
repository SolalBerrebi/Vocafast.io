import SwiftUI

struct TypingChallengeView: View {
    let card: TrainingCard
    let onAnswer: (String) -> Void

    @State private var typedAnswer = ""
    @State private var showResult = false
    @State private var wasCorrect = false
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 24) {
            // Word display
            VStack(spacing: 8) {
                Text(card.word.word)
                    .font(.title.bold())
                    .multilineTextAlignment(.center)

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
                            Text("Your answer: \(typedAnswer)")
                                .foregroundStyle(.red)
                            Text("Correct: \(card.word.translation)")
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
                TextField("Type the translation...", text: $typedAnswer)
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
                    Text("Check")
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
        }
        .onChange(of: card.id) { _, _ in
            typedAnswer = ""
            showResult = false
            wasCorrect = false
            isFocused = true
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

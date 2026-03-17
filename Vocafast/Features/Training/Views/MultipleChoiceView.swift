import SwiftUI

struct MultipleChoiceView: View {
    let card: TrainingCard
    let targetLang: String
    let onAnswer: (String) -> Void

    @State private var selectedAnswer: String?
    @State private var showResult = false

    private var isCorrect: Bool {
        selectedAnswer == card.word.translation
    }

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

            // Options
            VStack(spacing: 10) {
                ForEach(card.options, id: \.self) { option in
                    Button {
                        guard !showResult else { return }
                        selectedAnswer = option
                        showResult = true

                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                            onAnswer(option)
                            selectedAnswer = nil
                            showResult = false
                        }
                    } label: {
                        Text(option)
                            .font(.body)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(optionBackground(for: option))
                            .foregroundStyle(optionForeground(for: option))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(optionBorder(for: option), lineWidth: 2)
                            )
                    }
                    .disabled(showResult)
                }
            }
            .padding(.horizontal, 20)
        }
        .onAppear {
            SpeechService.shared.speak(card.word.word, language: targetLang)
        }
        .onChange(of: card.id) { _, _ in
            selectedAnswer = nil
            showResult = false
            SpeechService.shared.speak(card.word.word, language: targetLang)
        }
    }

    private func optionBackground(for option: String) -> Color {
        guard showResult else { return Color(.systemGray6) }
        if option == card.word.translation {
            return Color.green.opacity(0.15)
        }
        if option == selectedAnswer && !isCorrect {
            return Color.red.opacity(0.15)
        }
        return Color(.systemGray6)
    }

    private func optionForeground(for option: String) -> Color {
        guard showResult else { return .primary }
        if option == card.word.translation { return .green }
        if option == selectedAnswer && !isCorrect { return .red }
        return .primary
    }

    private func optionBorder(for option: String) -> Color {
        guard showResult else { return .clear }
        if option == card.word.translation { return .green }
        if option == selectedAnswer && !isCorrect { return .red }
        return .clear
    }
}

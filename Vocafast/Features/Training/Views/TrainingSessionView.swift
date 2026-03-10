import SwiftUI

struct TrainingSessionView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel: TrainingSessionViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var timer: Timer?
    @State private var xpResult: SessionXPResult?

    init(session: TrainingSession, cards: [TrainingCard], mode: TrainingMode, frontSide: CardFrontSide, showTimer: Bool) {
        _viewModel = StateObject(wrappedValue: TrainingSessionViewModel(
            session: session,
            cards: cards,
            mode: mode,
            frontSide: frontSide,
            showTimer: showTimer
        ))
    }

    var body: some View {
        if viewModel.isFinished {
            SessionSummaryView(
                correct: viewModel.correct,
                hard: viewModel.hard,
                incorrect: viewModel.incorrect,
                durationSeconds: viewModel.durationSeconds,
                avgResponseTimeMs: viewModel.avgResponseTimeMs,
                xpResult: xpResult,
                previousLevel: LevelSystem.getLevelForXP(appState.totalXp - (xpResult?.totalXP ?? 0)),
                currentLevel: LevelSystem.getLevelForXP(appState.totalXp)
            ) {
                dismiss()
            }
            .task {
                if xpResult == nil {
                    xpResult = await viewModel.finishSession(appState: appState)
                }
            }
        } else {
            VStack(spacing: 0) {
                // Top bar
                HStack {
                    Button("Quit") {
                        Task {
                            await viewModel.quit()
                            dismiss()
                        }
                    }
                    .foregroundStyle(.red)

                    Spacer()

                    if viewModel.showTimer {
                        Text(formatTime(viewModel.elapsedSeconds))
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Text(viewModel.cardCountText)
                        .font(.subheadline.weight(.semibold))
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)

                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(.systemGray5))
                            .frame(height: 6)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.accentColor)
                            .frame(width: geo.size.width * viewModel.progress, height: 6)
                            .animation(.easeInOut(duration: 0.3), value: viewModel.progress)
                    }
                }
                .frame(height: 6)
                .padding(.horizontal, 20)

                Spacer()

                // Card area
                if let card = viewModel.currentCard {
                    switch viewModel.mode {
                    case .flashcard:
                        FlashCardView(
                            card: card,
                            frontSide: viewModel.frontSide,
                            onAgain: { Task { await viewModel.answerAgain() } },
                            onHard: { Task { await viewModel.answerHard() } },
                            onGood: { Task { await viewModel.answerGood() } }
                        )
                    case .multiple_choice:
                        MultipleChoiceView(
                            card: card,
                            onAnswer: { selected in
                                Task { await viewModel.answerMultipleChoice(selected: selected) }
                            }
                        )
                    case .typing:
                        TypingChallengeView(
                            card: card,
                            onAnswer: { typed in
                                Task { await viewModel.answerTyping(typed: typed) }
                            }
                        )
                    }
                }

                Spacer()
            }
            .onAppear {
                timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
                    Task { @MainActor in
                        viewModel.elapsedSeconds += 1
                    }
                }
            }
            .onDisappear {
                timer?.invalidate()
            }
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}

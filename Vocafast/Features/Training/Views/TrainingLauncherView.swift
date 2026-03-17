import SwiftUI
import SwiftData

struct TrainingLauncherView: View {
    let deckId: UUID
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel: TrainingLauncherViewModel
    @State private var showTrainingSession = false
    @State private var sessionData: (session: TrainingSession, cards: [TrainingCard])?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    init(deckId: UUID) {
        self.deckId = deckId
        _viewModel = StateObject(wrappedValue: TrainingLauncherViewModel(deckId: deckId))
    }

    private var targetFlag: String {
        Config.languageFlag(for: appState.activeEnvironment?.targetLang ?? "en")
    }

    private var nativeFlag: String {
        Config.languageFlag(for: appState.nativeLang)
    }

    private var targetName: String {
        Config.languageName(for: appState.activeEnvironment?.targetLang ?? "en")
    }

    private var nativeName: String {
        Config.languageName(for: appState.nativeLang)
    }

    var body: some View {
        VStack(spacing: 0) {
            if viewModel.isLoading && viewModel.stats == nil {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let stats = viewModel.stats {
                VStack(spacing: 18) {
                    // MARK: - Stats Bar (iPhone Storage style)
                    StatsBarView(stats: stats)
                        .padding(.horizontal, 16)

                    // MARK: - Training Mode
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("training_mode"))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)

                        HStack(spacing: 8) {
                            ModeButton(title: L("training_flashcards"), icon: "rectangle.stack", isSelected: viewModel.selectedMode == .flashcard) {
                                viewModel.selectedMode = .flashcard
                            }
                            ModeButton(title: L("training_multiple_choice"), icon: "list.bullet", isSelected: viewModel.selectedMode == .multiple_choice) {
                                viewModel.selectedMode = .multiple_choice
                            }
                            ModeButton(title: L("training_typing"), icon: "keyboard", isSelected: viewModel.selectedMode == .typing) {
                                viewModel.selectedMode = .typing
                            }
                        }
                    }
                    .padding(.horizontal, 16)

                    // MARK: - Card Front Side (with flags)
                    if viewModel.selectedMode == .flashcard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(L("training_card_front"))
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)

                            HStack(spacing: 8) {
                                Button {
                                    viewModel.frontSide = .word
                                    HapticsManager.selection()
                                } label: {
                                    HStack(spacing: 6) {
                                        Text(targetFlag)
                                            .font(.title3)
                                        Text(targetName)
                                            .font(.subheadline.weight(.medium))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .fill(viewModel.frontSide == .word ? Color.accentColor.opacity(0.15) : Color(.systemGray6))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(viewModel.frontSide == .word ? Color.accentColor : .clear, lineWidth: 2)
                                    )
                                    .foregroundStyle(viewModel.frontSide == .word ? Color.accentColor : .primary)
                                }

                                Button {
                                    viewModel.frontSide = .translation
                                    HapticsManager.selection()
                                } label: {
                                    HStack(spacing: 6) {
                                        Text(nativeFlag)
                                            .font(.title3)
                                        Text(nativeName)
                                            .font(.subheadline.weight(.medium))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .fill(viewModel.frontSide == .translation ? Color.accentColor.opacity(0.15) : Color(.systemGray6))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(viewModel.frontSide == .translation ? Color.accentColor : .clear, lineWidth: 2)
                                    )
                                    .foregroundStyle(viewModel.frontSide == .translation ? Color.accentColor : .primary)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }

                    // MARK: - Study Scope (compact pills)
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("training_study_scope"))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: StudyScope.allCases.count), spacing: 0) {
                            ForEach(StudyScope.allCases, id: \.self) { scope in
                                Button {
                                    viewModel.selectedScope = scope
                                    HapticsManager.selection()
                                } label: {
                                    Text(scope.localizedName)
                                        .font(.caption)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.7)
                                        .padding(.vertical, 8)
                                        .frame(maxWidth: .infinity)
                                        .background(
                                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                                .fill(viewModel.selectedScope == scope ? Color.accentColor : Color(.systemGray6))
                                        )
                                        .foregroundStyle(viewModel.selectedScope == scope ? .white : .primary)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)

                    // MARK: - Session Size
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("training_session_size"))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)

                        HStack(spacing: 8) {
                            ForEach(viewModel.sessionSizes, id: \.self) { size in
                                Button {
                                    viewModel.sessionSize = size
                                    HapticsManager.selection()
                                } label: {
                                    Text(size == 0 ? "∞" : "\(size)")
                                        .font(.subheadline.weight(.semibold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(
                                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                                .fill(viewModel.sessionSize == size ? Color.accentColor : Color(.systemGray6))
                                        )
                                        .foregroundStyle(viewModel.sessionSize == size ? .white : .primary)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.callout)
                            .foregroundStyle(.red)
                            .padding(.horizontal, 16)
                    }

                    Spacer(minLength: 0)

                    // MARK: - Start Button
                    Button {
                        Task {
                            if let data = await viewModel.startSession(environmentId: appState.activeEnvironmentId, modelContext: modelContext) {
                                sessionData = data
                                showTrainingSession = true
                            }
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                HStack(spacing: 8) {
                                    Image(systemName: "play.fill")
                                    Text(L("training_start"))
                                }
                            }
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .foregroundStyle(.white)
                        .background(stats.total > 0 ? Color.accentColor : Color.gray)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .disabled(viewModel.isLoading || stats.total == 0)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
                .padding(.top, 16)
            }
        }
        .navigationTitle(L("training_title"))
        .fullScreenCover(isPresented: $showTrainingSession, onDismiss: {
            dismiss()
        }) {
            if let data = sessionData {
                TrainingSessionView(
                    session: data.session,
                    cards: data.cards,
                    mode: viewModel.selectedMode,
                    frontSide: viewModel.frontSide,
                    showTimer: appState.showTimer
                )
            }
        }
        .task {
            await viewModel.load()
        }
    }
}

// MARK: - Stats Bar (iPhone Storage style)

private struct StatsBarView: View {
    let stats: WordRepository.DeckStats

    private var total: CGFloat {
        CGFloat(max(stats.total, 1))
    }

    var body: some View {
        VStack(spacing: 10) {
            // Stacked bar
            GeometryReader { geo in
                let w = geo.size.width
                HStack(spacing: 1.5) {
                    if stats.due > 0 {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.orange)
                            .frame(width: max(6, w * CGFloat(stats.due) / total))
                    }
                    if stats.newCount > 0 {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.blue)
                            .frame(width: max(6, w * CGFloat(stats.newCount) / total))
                    }
                    if stats.learning > 0 {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.yellow)
                            .frame(width: max(6, w * CGFloat(stats.learning) / total))
                    }
                    if stats.mastered > 0 {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.green)
                            .frame(width: max(6, w * CGFloat(stats.mastered) / total))
                    }
                }
            }
            .frame(height: 10)
            .clipShape(Capsule())
            .background(Capsule().fill(Color(UIColor.systemGray5)))

            // Legend
            HStack(spacing: 16) {
                StatLegend(color: .orange, label: L("training_due"), value: stats.due)
                StatLegend(color: .blue, label: L("training_new"), value: stats.newCount)
                StatLegend(color: .yellow, label: L("training_learning"), value: stats.learning)
                StatLegend(color: .green, label: L("training_mastered"), value: stats.mastered)
            }
        }
        .padding(14)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct StatLegend: View {
    let color: Color
    let label: String
    let value: Int

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(value)")
                .font(.caption.bold())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Mode Button

private struct ModeButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title3)
                Text(title)
                    .font(.caption2)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(isSelected ? Color.accentColor.opacity(0.15) : Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
            )
            .foregroundStyle(isSelected ? Color.accentColor : .primary)
        }
    }
}

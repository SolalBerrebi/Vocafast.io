import SwiftUI

struct TrainingLauncherView: View {
    let deckId: UUID
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel: TrainingLauncherViewModel
    @State private var showTrainingSession = false
    @State private var sessionData: (session: TrainingSession, cards: [TrainingCard])?

    init(deckId: UUID) {
        self.deckId = deckId
        _viewModel = StateObject(wrappedValue: TrainingLauncherViewModel(deckId: deckId))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if viewModel.isLoading && viewModel.stats == nil {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: 200)
                } else if let stats = viewModel.stats {
                    // Stats cards
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatCard(title: "Due", value: "\(stats.due)", color: .orange)
                        StatCard(title: "New", value: "\(stats.newCount)", color: .blue)
                        StatCard(title: "Learning", value: "\(stats.learning)", color: .yellow)
                        StatCard(title: "Mastered", value: "\(stats.mastered)", color: .green)
                    }

                    // Study scope
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Study Scope")
                            .font(.headline)

                        ForEach(StudyScope.allCases, id: \.self) { scope in
                            Button {
                                viewModel.selectedScope = scope
                                HapticsManager.selection()
                            } label: {
                                HStack {
                                    Image(systemName: viewModel.selectedScope == scope ? "largecircle.fill.circle" : "circle")
                                        .foregroundStyle(viewModel.selectedScope == scope ? .accentColor : .secondary)
                                    Text(scope.rawValue)
                                        .foregroundStyle(.primary)
                                    Spacer()
                                }
                                .padding(.vertical, 8)
                            }
                        }
                    }

                    // Training mode
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Training Mode")
                            .font(.headline)

                        HStack(spacing: 8) {
                            ModeButton(title: "Flashcards", icon: "rectangle.stack", isSelected: viewModel.selectedMode == .flashcard) {
                                viewModel.selectedMode = .flashcard
                            }
                            ModeButton(title: "Multiple Choice", icon: "list.bullet", isSelected: viewModel.selectedMode == .multiple_choice) {
                                viewModel.selectedMode = .multiple_choice
                            }
                            ModeButton(title: "Typing", icon: "keyboard", isSelected: viewModel.selectedMode == .typing) {
                                viewModel.selectedMode = .typing
                            }
                        }
                    }

                    // Card front side (flashcards only)
                    if viewModel.selectedMode == .flashcard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Card Front Side")
                                .font(.headline)

                            Picker("Front Side", selection: $viewModel.frontSide) {
                                ForEach(CardFrontSide.allCases, id: \.self) { side in
                                    Text(side.rawValue).tag(side)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                    }

                    // Session size
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Session Size")
                            .font(.headline)

                        HStack(spacing: 8) {
                            ForEach(viewModel.sessionSizes, id: \.self) { size in
                                Button {
                                    viewModel.sessionSize = size
                                    HapticsManager.selection()
                                } label: {
                                    Text("\(size)")
                                        .font(.subheadline.weight(.semibold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(
                                            RoundedRectangle(cornerRadius: 10)
                                                .fill(viewModel.sessionSize == size ? Color.accentColor : Color(.systemGray6))
                                        )
                                        .foregroundStyle(viewModel.sessionSize == size ? .white : .primary)
                                }
                            }
                        }
                    }

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.callout)
                            .foregroundStyle(.red)
                    }

                    // Start button
                    Button {
                        Task {
                            if let data = await viewModel.startSession(environmentId: appState.activeEnvironmentId) {
                                sessionData = data
                                showTrainingSession = true
                            }
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Start Training")
                            }
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .foregroundStyle(.white)
                        .background(stats.total > 0 ? Color.accentColor : Color.gray)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .disabled(viewModel.isLoading || stats.total == 0)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
        }
        .navigationTitle("Training")
        .fullScreenCover(isPresented: $showTrainingSession) {
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

private struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
                .foregroundStyle(color)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemGray6))
        )
    }
}

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
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.accentColor.opacity(0.15) : Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
            )
            .foregroundStyle(isSelected ? .accentColor : .primary)
        }
    }
}

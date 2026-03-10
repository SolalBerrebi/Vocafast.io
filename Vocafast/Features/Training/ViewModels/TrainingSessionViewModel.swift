import SwiftUI

@MainActor
final class TrainingSessionViewModel: ObservableObject {
    let session: TrainingSession
    let cards: [TrainingCard]
    let mode: TrainingMode
    let frontSide: CardFrontSide

    @Published var currentIndex = 0
    @Published var correct = 0
    @Published var hard = 0
    @Published var incorrect = 0
    @Published var isFinished = false
    @Published var showTimer: Bool
    @Published var elapsedSeconds = 0

    private let wordRepo = WordRepository()
    private let trainingRepo = TrainingRepository()
    private let profileRepo = ProfileRepository()

    private let startedAt = Date()
    private var cardStartedAt = Date()
    private var responseTimes: [Int] = []

    var currentCard: TrainingCard? {
        guard currentIndex < cards.count else { return nil }
        return cards[currentIndex]
    }

    var progress: Double {
        guard !cards.isEmpty else { return 0 }
        return Double(currentIndex) / Double(cards.count)
    }

    var cardCountText: String {
        "\(min(currentIndex + 1, cards.count)) / \(cards.count)"
    }

    init(session: TrainingSession, cards: [TrainingCard], mode: TrainingMode, frontSide: CardFrontSide, showTimer: Bool) {
        self.session = session
        self.cards = cards
        self.mode = mode
        self.frontSide = frontSide
        self.showTimer = showTimer
    }

    // MARK: - Answer Handling

    func submitAnswer(quality: Int, wasCorrect: Bool) async {
        guard let card = currentCard else { return }

        // Record response time
        let responseTimeMs = Int(Date().timeIntervalSince(cardStartedAt) * 1000)
        responseTimes.append(responseTimeMs)

        // Track answer category
        if !wasCorrect {
            incorrect += 1
        } else if quality <= 3 {
            hard += 1
        } else {
            correct += 1
        }

        // Calculate SRS update
        let srs = SRSEngine.calculate(
            quality: quality,
            currentEaseFactor: card.word.easeFactor,
            currentInterval: card.word.intervalDays,
            currentRepetitions: card.word.repetitions
        )

        // Update word SRS in DB
        do {
            try await wordRepo.updateSRS(
                id: card.word.id,
                easeFactor: srs.easeFactor,
                interval: srs.interval,
                repetitions: srs.repetitions,
                nextReviewAt: srs.nextReviewAt.iso8601String
            )

            // Log review
            try await trainingRepo.logReview(
                sessionId: session.id,
                wordId: card.word.id,
                quality: quality,
                wasCorrect: wasCorrect
            )
        } catch {
            // Continue even if DB fails
        }

        // Advance
        let next = currentIndex + 1
        if next >= cards.count {
            currentIndex = next
            isFinished = true
        } else {
            currentIndex = next
            cardStartedAt = Date()
        }

        // Haptics
        if wasCorrect {
            HapticsManager.success()
        } else {
            HapticsManager.error()
        }
    }

    // MARK: - Flashcard Answers

    func answerAgain() async {
        await submitAnswer(quality: 1, wasCorrect: false)
    }

    func answerHard() async {
        await submitAnswer(quality: 3, wasCorrect: true)
    }

    func answerGood() async {
        await submitAnswer(quality: 5, wasCorrect: true)
    }

    // MARK: - Multiple Choice / Typing

    func answerMultipleChoice(selected: String) async {
        guard let card = currentCard else { return }
        let wasCorrect = selected == card.word.translation
        let responseTimeMs = Int(Date().timeIntervalSince(cardStartedAt) * 1000)
        let quality = SRSEngine.qualityFromCorrectness(wasCorrect: wasCorrect, responseTimeMs: responseTimeMs)
        await submitAnswer(quality: quality, wasCorrect: wasCorrect)
    }

    func answerTyping(typed: String) async {
        guard let card = currentCard else { return }
        let wasCorrect = SRSEngine.isFuzzyMatch(typed: typed, correct: card.word.translation)
        let responseTimeMs = Int(Date().timeIntervalSince(cardStartedAt) * 1000)
        let quality = SRSEngine.qualityFromCorrectness(wasCorrect: wasCorrect, responseTimeMs: responseTimeMs)
        await submitAnswer(quality: quality, wasCorrect: wasCorrect)
    }

    // MARK: - Session Results

    var avgResponseTimeMs: Int {
        guard !responseTimes.isEmpty else { return 0 }
        return responseTimes.reduce(0, +) / responseTimes.count
    }

    var durationSeconds: Int {
        Int(Date().timeIntervalSince(startedAt))
    }

    func calculateXP(streakDays: Int) -> SessionXPResult {
        XPEngine.calculateSessionXP(
            correct: correct,
            hard: hard,
            incorrect: incorrect,
            avgResponseTimeMs: avgResponseTimeMs,
            streakDays: streakDays
        )
    }

    func finishSession(appState: AppState) async -> SessionXPResult {
        let xpResult = calculateXP(streakDays: appState.streakDays)

        // Update training session in DB
        do {
            try await trainingRepo.finishSession(
                id: session.id,
                correct: correct,
                incorrect: incorrect + hard,
                duration: durationSeconds,
                avgTime: avgResponseTimeMs,
                xp: xpResult.totalXP
            )
        } catch {}

        // Award XP
        let newTotal = appState.totalXp + xpResult.totalXP
        let newLevel = LevelSystem.getLevelForXP(newTotal)

        // Update streak
        let today = Date().yyyyMMdd
        var newStreak = appState.streakDays
        if appState.lastActiveDate != today {
            let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date())?.yyyyMMdd
            newStreak = appState.lastActiveDate == yesterday ? appState.streakDays + 1 : 1
        }

        // Update profile in DB
        do {
            try await profileRepo.updateGamification(
                xp: newTotal,
                level: newLevel.level,
                streak: newStreak,
                date: today
            )
        } catch {}

        // Update local state
        appState.updateGamification(
            xp: newTotal,
            level: newLevel.level,
            streak: newStreak,
            date: today
        )

        return xpResult
    }

    func quit() async {
        // Mark session as finished even if quitting early
        do {
            try await trainingRepo.finishSession(
                id: session.id,
                correct: correct,
                incorrect: incorrect + hard,
                duration: durationSeconds,
                avgTime: avgResponseTimeMs,
                xp: 0
            )
        } catch {}
    }
}

import Foundation

enum StudyScope: String, CaseIterable {
    case smart = "Smart Review"
    case all = "All Words"
    case mistakes = "Difficult Words"
    case newOnly = "New Only"
}

enum CardFrontSide: String, CaseIterable {
    case word = "Word"
    case translation = "Translation"
}

struct TrainingCard: Identifiable {
    let id: UUID
    let word: Word
    var options: [String]

    init(word: Word, options: [String] = []) {
        self.id = word.id
        self.word = word
        self.options = options
    }
}

struct SRSResult {
    let easeFactor: Double
    let interval: Int
    let repetitions: Int
    let nextReviewAt: Date
}

struct SessionXPResult {
    let baseXP: Int
    let speedBonus: Int
    let streakMultiplier: Double
    let completionBonus: Int
    let totalXP: Int
}

import Foundation

enum StudyScope: String, CaseIterable {
    case smart, all, mistakes, newOnly

    var localizedName: String {
        switch self {
        case .smart: return L("scope_smart")
        case .all: return L("scope_all")
        case .mistakes: return L("scope_mistakes")
        case .newOnly: return L("scope_new_only")
        }
    }
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

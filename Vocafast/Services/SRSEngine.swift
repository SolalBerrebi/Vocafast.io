import Foundation

enum SRSEngine {
    /// SM-2 Spaced Repetition Algorithm
    static func calculate(quality: Int, currentEaseFactor: Double, currentInterval: Int, currentRepetitions: Int) -> SRSResult {
        let q = max(0, min(5, quality))

        var easeFactor = currentEaseFactor
        var interval: Int
        var repetitions: Int

        if q < 3 {
            // Failed — reset
            repetitions = 0
            interval = 1
        } else {
            // Passed
            repetitions = currentRepetitions + 1
            if repetitions == 1 {
                interval = 1
            } else if repetitions == 2 {
                interval = 6
            } else {
                interval = Int(round(Double(currentInterval) * easeFactor))
            }
        }

        // Update ease factor
        easeFactor = easeFactor + (0.1 - Double(5 - q) * (0.08 + Double(5 - q) * 0.02))
        easeFactor = max(1.3, easeFactor)

        let nextReviewAt = Calendar.current.date(byAdding: .day, value: interval, to: Date()) ?? Date()

        return SRSResult(
            easeFactor: easeFactor,
            interval: interval,
            repetitions: repetitions,
            nextReviewAt: nextReviewAt
        )
    }

    /// Determine quality rating from user interaction
    static func qualityFromCorrectness(wasCorrect: Bool, responseTimeMs: Int? = nil) -> Int {
        if !wasCorrect { return 1 }

        if let responseTimeMs {
            if responseTimeMs < 2000 { return 5 }
            if responseTimeMs < 5000 { return 4 }
            return 3
        }

        return 4
    }

    /// Levenshtein distance for fuzzy matching in typing mode
    static func levenshteinDistance(_ a: String, _ b: String) -> Int {
        let a = Array(a)
        let b = Array(b)
        var matrix = [[Int]](repeating: [Int](repeating: 0, count: a.count + 1), count: b.count + 1)

        for i in 0...b.count { matrix[i][0] = i }
        for j in 0...a.count { matrix[0][j] = j }

        for i in 1...b.count {
            for j in 1...a.count {
                if b[i - 1] == a[j - 1] {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }

        return matrix[b.count][a.count]
    }

    /// Check if typed answer is close enough (Levenshtein distance <= 2)
    static func isFuzzyMatch(typed: String, correct: String) -> Bool {
        let a = typed.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let b = correct.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if a == b { return true }
        return levenshteinDistance(a, b) <= 2
    }
}

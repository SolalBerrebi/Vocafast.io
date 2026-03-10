import Foundation

enum XPEngine {
    static func calculateSessionXP(correct: Int, hard: Int, incorrect: Int, avgResponseTimeMs: Int, streakDays: Int) -> SessionXPResult {
        // Base XP per answer type
        let baseXP = correct * 10 + hard * 5 + incorrect * 2

        // Speed bonus: up to 50% extra for fast answers (< 5s avg)
        var speedMultiplier = 1.0
        if avgResponseTimeMs > 0 && avgResponseTimeMs < 5000 {
            speedMultiplier = 1.0 + Double(5000 - avgResponseTimeMs) / 10000.0
        }
        let speedBonus = Int(round(Double(baseXP) * (speedMultiplier - 1)))

        // Streak multiplier
        var streakMultiplier = 1.0
        if streakDays >= 7 {
            streakMultiplier = 1.5
        } else if streakDays >= 4 {
            streakMultiplier = 1.2
        } else if streakDays >= 2 {
            streakMultiplier = 1.1
        }

        // Flat completion bonus
        let completionBonus = 20

        let totalXP = Int(round(Double(baseXP + speedBonus + completionBonus) * streakMultiplier))

        return SessionXPResult(
            baseXP: baseXP,
            speedBonus: speedBonus,
            streakMultiplier: streakMultiplier,
            completionBonus: completionBonus,
            totalXP: totalXP
        )
    }
}

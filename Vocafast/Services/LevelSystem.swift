import Foundation

enum LevelSystem {
    static let levels: [Level] = [
        Level(level: 1, emoji: "🌱", name: "Sprout", xpRequired: 0),
        Level(level: 2, emoji: "🕯️", name: "Flame Keeper", xpRequired: 50),
        Level(level: 3, emoji: "📿", name: "Apprentice", xpRequired: 150),
        Level(level: 4, emoji: "🔮", name: "Seer", xpRequired: 350),
        Level(level: 5, emoji: "🧪", name: "Alchemist", xpRequired: 650),
        Level(level: 6, emoji: "📜", name: "Scholar", xpRequired: 1100),
        Level(level: 7, emoji: "🗝️", name: "Key Master", xpRequired: 1800),
        Level(level: 8, emoji: "🪄", name: "Enchanter", xpRequired: 2800),
        Level(level: 9, emoji: "🧿", name: "Oracle", xpRequired: 4200),
        Level(level: 10, emoji: "⚗️", name: "Sage", xpRequired: 6000),
        Level(level: 11, emoji: "🔱", name: "Sovereign", xpRequired: 8500),
        Level(level: 12, emoji: "⚡", name: "Storm Caller", xpRequired: 11500),
        Level(level: 13, emoji: "💎", name: "Crystal Lord", xpRequired: 15000),
        Level(level: 14, emoji: "🌋", name: "Titan", xpRequired: 20000),
        Level(level: 15, emoji: "🐉", name: "Dragon Rider", xpRequired: 27000),
        Level(level: 16, emoji: "👑", name: "Eternal", xpRequired: 36000),
    ]

    static func getLevelForXP(_ totalXp: Int) -> Level {
        var current = levels[0]
        for level in levels {
            if totalXp >= level.xpRequired {
                current = level
            } else {
                break
            }
        }
        return current
    }

    static func getNextLevel(_ totalXp: Int) -> Level? {
        let current = getLevelForXP(totalXp)
        return levels.first(where: { $0.level == current.level + 1 })
    }

    /// Returns 0-100 progress percentage toward next level
    static func getXPProgress(_ totalXp: Int) -> Int {
        let current = getLevelForXP(totalXp)
        guard let next = getNextLevel(totalXp) else { return 100 }
        let range = next.xpRequired - current.xpRequired
        let progress = totalXp - current.xpRequired
        return min(100, Int(round(Double(progress) / Double(range) * 100)))
    }

    /// Returns XP remaining until next level
    static func getXPToNextLevel(_ totalXp: Int) -> Int {
        guard let next = getNextLevel(totalXp) else { return 0 }
        return next.xpRequired - totalXp
    }
}

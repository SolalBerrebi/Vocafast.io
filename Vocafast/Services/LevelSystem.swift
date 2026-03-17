import Foundation
import SwiftUI

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

    // MARK: - Level Colors

    /// Returns the signature gradient colors for a given level
    static func gradientColors(for level: Int) -> (top: Color, bottom: Color) {
        switch level {
        case 1:  return (Color(red: 0.20, green: 0.55, blue: 0.25), Color(red: 0.08, green: 0.30, blue: 0.12))  // 🌱 green
        case 2:  return (Color(red: 0.70, green: 0.42, blue: 0.12), Color(red: 0.45, green: 0.25, blue: 0.05))  // 🕯️ amber
        case 3:  return (Color(red: 0.15, green: 0.50, blue: 0.50), Color(red: 0.08, green: 0.30, blue: 0.32))  // 📿 teal
        case 4:  return (Color(red: 0.50, green: 0.18, blue: 0.65), Color(red: 0.28, green: 0.08, blue: 0.40))  // 🔮 purple
        case 5:  return (Color(red: 0.10, green: 0.58, blue: 0.38), Color(red: 0.04, green: 0.32, blue: 0.18))  // 🧪 emerald
        case 6:  return (Color(red: 0.68, green: 0.52, blue: 0.10), Color(red: 0.42, green: 0.30, blue: 0.04))  // 📜 gold
        case 7:  return (Color(red: 0.62, green: 0.40, blue: 0.18), Color(red: 0.38, green: 0.22, blue: 0.08))  // 🗝️ bronze
        case 8:  return (Color(red: 0.35, green: 0.15, blue: 0.65), Color(red: 0.18, green: 0.05, blue: 0.40))  // 🪄 indigo
        case 9:  return (Color(red: 0.12, green: 0.22, blue: 0.58), Color(red: 0.05, green: 0.12, blue: 0.35))  // 🧿 deep blue
        case 10: return (Color(red: 0.10, green: 0.48, blue: 0.52), Color(red: 0.04, green: 0.28, blue: 0.32))  // ⚗️ cyan
        case 11: return (Color(red: 0.15, green: 0.18, blue: 0.58), Color(red: 0.06, green: 0.08, blue: 0.35))  // 🔱 royal blue
        case 12: return (Color(red: 0.65, green: 0.58, blue: 0.08), Color(red: 0.40, green: 0.35, blue: 0.02))  // ⚡ electric gold
        case 13: return (Color(red: 0.10, green: 0.55, blue: 0.70), Color(red: 0.04, green: 0.30, blue: 0.45))  // 💎 diamond
        case 14: return (Color(red: 0.70, green: 0.18, blue: 0.12), Color(red: 0.45, green: 0.08, blue: 0.06))  // 🌋 lava
        case 15: return (Color(red: 0.25, green: 0.52, blue: 0.18), Color(red: 0.12, green: 0.32, blue: 0.08))  // 🐉 forest
        case 16: return (Color(red: 0.75, green: 0.60, blue: 0.15), Color(red: 0.50, green: 0.38, blue: 0.05))  // 👑 gold
        default: return (Color(red: 0.25, green: 0.10, blue: 0.45), Color(red: 0.15, green: 0.05, blue: 0.30))
        }
    }

    /// Returns blended gradient colors based on XP progress toward next level
    static func blendedGradient(totalXp: Int) -> [Color] {
        let current = getLevelForXP(totalXp)
        let progress = Double(getXPProgress(totalXp)) / 100.0
        let currentColors = gradientColors(for: current.level)

        guard let next = getNextLevel(totalXp) else {
            // Max level — keep current colors
            return [currentColors.top, currentColors.bottom]
        }

        let nextColors = gradientColors(for: next.level)

        // Blend: start shifting subtly after 30% progress, accelerate toward the end
        let t = max(0, (progress - 0.3) / 0.7) // 0 until 30%, then ramp to 1
        let eased = t * t // ease-in curve for a natural feel

        let topBlended = blendColor(currentColors.top, nextColors.top, t: eased)
        let bottomBlended = blendColor(currentColors.bottom, nextColors.bottom, t: eased)

        return [topBlended, bottomBlended]
    }

    /// Linear interpolation between two Colors
    private static func blendColor(_ a: Color, _ b: Color, t: Double) -> Color {
        let aComps = UIColor(a).rgbaComponents
        let bComps = UIColor(b).rgbaComponents
        return Color(
            red: aComps.r + (bComps.r - aComps.r) * t,
            green: aComps.g + (bComps.g - aComps.g) * t,
            blue: aComps.b + (bComps.b - aComps.b) * t
        )
    }
}

// MARK: - UIColor helper for extracting RGB

private extension UIColor {
    var rgbaComponents: (r: Double, g: Double, b: Double, a: Double) {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return (Double(r), Double(g), Double(b), Double(a))
    }
}

import Foundation

struct Profile: Codable, Identifiable {
    let id: UUID
    var displayName: String?
    var nativeLang: String
    var onboardingCompleted: Bool
    var totalXp: Int
    var level: Int
    var streakDays: Int
    var lastActiveDate: String?
    var showTimer: Bool
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case nativeLang = "native_lang"
        case onboardingCompleted = "onboarding_completed"
        case totalXp = "total_xp"
        case level
        case streakDays = "streak_days"
        case lastActiveDate = "last_active_date"
        case showTimer = "show_timer"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

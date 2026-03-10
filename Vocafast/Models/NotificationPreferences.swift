import Foundation

struct NotificationPreferences: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var notificationsEnabled: Bool
    var dailyGoalEnabled: Bool
    var dailyGoalWords: Int
    var dailyGoalSessions: Int
    var reminderEnabled: Bool
    var reminderTime: String
    var reminderDays: [Bool]
    var streakReminderEnabled: Bool
    var streakReminderTime: String
    var reviewDueEnabled: Bool
    var achievementsEnabled: Bool
    var inactivityNudgeEnabled: Bool
    var inactivityNudgeDays: Int
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case notificationsEnabled = "notifications_enabled"
        case dailyGoalEnabled = "daily_goal_enabled"
        case dailyGoalWords = "daily_goal_words"
        case dailyGoalSessions = "daily_goal_sessions"
        case reminderEnabled = "reminder_enabled"
        case reminderTime = "reminder_time"
        case reminderDays = "reminder_days"
        case streakReminderEnabled = "streak_reminder_enabled"
        case streakReminderTime = "streak_reminder_time"
        case reviewDueEnabled = "review_due_enabled"
        case achievementsEnabled = "achievements_enabled"
        case inactivityNudgeEnabled = "inactivity_nudge_enabled"
        case inactivityNudgeDays = "inactivity_nudge_days"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

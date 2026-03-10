import UserNotifications

enum NotificationScheduler {
    static func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }

    static func scheduleDailyReminder(hour: Int, minute: Int, days: [Bool]) {
        let center = UNUserNotificationCenter.current()
        // Remove existing daily reminders
        center.removePendingNotificationRequests(withIdentifiers: (0..<7).map { "daily_reminder_\($0)" })

        let content = UNMutableNotificationContent()
        content.title = "Time to practice!"
        content.body = "Keep your streak going — review your vocabulary today."
        content.sound = .default

        // days = [Mon..Sun] → weekday 2..8 (Sunday = 1 in Calendar)
        let weekdayMap = [2, 3, 4, 5, 6, 7, 1] // Mon=2, Tue=3, ... Sun=1

        for (index, enabled) in days.enumerated() where enabled {
            var dateComponents = DateComponents()
            dateComponents.hour = hour
            dateComponents.minute = minute
            dateComponents.weekday = weekdayMap[index]

            let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
            let request = UNNotificationRequest(identifier: "daily_reminder_\(index)", content: content, trigger: trigger)
            center.add(request)
        }
    }

    static func scheduleStreakReminder(hour: Int, minute: Int) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["streak_reminder"])

        let content = UNMutableNotificationContent()
        content.title = "Don't break your streak!"
        content.body = "You haven't practiced today. A quick session keeps the streak alive."
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "streak_reminder", content: content, trigger: trigger)
        center.add(request)
    }

    static func scheduleInactivityNudge(days: Int) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["inactivity_nudge"])

        let content = UNMutableNotificationContent()
        content.title = "We miss you!"
        content.body = "You haven't practiced in \(days) days. Come back and review your vocabulary."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Double(days * 86400), repeats: false)
        let request = UNNotificationRequest(identifier: "inactivity_nudge", content: content, trigger: trigger)
        center.add(request)
    }

    static func cancelAll() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}

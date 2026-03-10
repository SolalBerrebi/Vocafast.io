import Foundation

extension Date {
    var yyyyMMdd: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: self)
    }

    var iso8601String: String {
        ISO8601DateFormatter().string(from: self)
    }

    static func fromISO(_ string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: string) { return date }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: string)
    }

    func mmssString(from start: Date) -> String {
        let interval = Int(self.timeIntervalSince(start))
        let minutes = interval / 60
        let seconds = interval % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

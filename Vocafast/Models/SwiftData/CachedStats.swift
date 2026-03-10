import Foundation
import SwiftData

@Model
class CachedStats {
    @Attribute(.unique) var environmentId: UUID
    var totalWords: Int
    var masteredWords: Int
    var totalSessions: Int
    var totalCorrect: Int
    var totalIncorrect: Int
    var sessionDates: [String]
    var lastSynced: Date

    init(environmentId: UUID, totalWords: Int = 0, masteredWords: Int = 0, totalSessions: Int = 0, totalCorrect: Int = 0, totalIncorrect: Int = 0, sessionDates: [String] = [], lastSynced: Date = Date()) {
        self.environmentId = environmentId
        self.totalWords = totalWords
        self.masteredWords = masteredWords
        self.totalSessions = totalSessions
        self.totalCorrect = totalCorrect
        self.totalIncorrect = totalIncorrect
        self.sessionDates = sessionDates
        self.lastSynced = lastSynced
    }
}

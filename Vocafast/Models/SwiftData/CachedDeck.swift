import Foundation
import SwiftData

@Model
class CachedDeck {
    @Attribute(.unique) var id: UUID
    var environmentId: UUID
    var name: String
    var color: String
    var icon: String
    var wordCount: Int
    var lastSynced: Date

    init(id: UUID, environmentId: UUID, name: String, color: String, icon: String, wordCount: Int, lastSynced: Date = Date()) {
        self.id = id
        self.environmentId = environmentId
        self.name = name
        self.color = color
        self.icon = icon
        self.wordCount = wordCount
        self.lastSynced = lastSynced
    }

    convenience init(from deck: Deck) {
        self.init(
            id: deck.id,
            environmentId: deck.environmentId,
            name: deck.name,
            color: deck.color,
            icon: deck.icon,
            wordCount: deck.wordCount
        )
    }
}

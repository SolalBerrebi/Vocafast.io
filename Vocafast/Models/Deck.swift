import Foundation

struct Deck: Codable, Identifiable {
    let id: UUID
    let environmentId: UUID
    var name: String
    var color: String
    var icon: String
    var wordCount: Int
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case environmentId = "environment_id"
        case name, color, icon
        case wordCount = "word_count"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

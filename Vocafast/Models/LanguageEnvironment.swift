import Foundation

struct LanguageEnvironment: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var targetLang: String
    var isActive: Bool
    var color: String
    var icon: String
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case targetLang = "target_lang"
        case isActive = "is_active"
        case color, icon
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

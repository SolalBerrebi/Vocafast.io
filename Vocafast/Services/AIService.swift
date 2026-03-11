import Foundation

struct ExtractedWord: Identifiable, Codable {
    var id: UUID = UUID()
    let word: String
    let translation: String
    let context: String?
    var isSelected: Bool = true

    enum CodingKeys: String, CodingKey {
        case word, translation, context
    }

    init(word: String, translation: String, context: String? = nil) {
        self.word = word
        self.translation = translation
        self.context = context
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        word = try container.decode(String.self, forKey: .word)
        translation = try container.decode(String.self, forKey: .translation)
        context = try container.decodeIfPresent(String.self, forKey: .context)
    }
}

protocol AIService {
    func extractFromText(text: String, nativeLang: String, targetLang: String, includeContext: Bool) async throws -> [ExtractedWord]
    func extractFromImage(base64: String, mimeType: String, nativeLang: String, targetLang: String, includeContext: Bool) async throws -> [ExtractedWord]
    func generateTopic(topic: String, nativeLang: String, targetLang: String, existingWords: [String], wordCount: Int, level: String?, includeContext: Bool) async throws -> [ExtractedWord]
}

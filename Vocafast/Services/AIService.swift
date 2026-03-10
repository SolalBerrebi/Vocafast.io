import Foundation

struct ExtractedWord: Identifiable, Codable {
    var id: UUID = UUID()
    let word: String
    let translation: String
    var isSelected: Bool = true

    enum CodingKeys: String, CodingKey {
        case word, translation
    }
}

protocol AIService {
    func extractFromText(text: String, nativeLang: String, targetLang: String) async throws -> [ExtractedWord]
    func extractFromImage(base64: String, mimeType: String, nativeLang: String, targetLang: String) async throws -> [ExtractedWord]
    func generateTopic(topic: String, nativeLang: String, targetLang: String, existingWords: [String], wordCount: Int, level: String?) async throws -> [ExtractedWord]
}

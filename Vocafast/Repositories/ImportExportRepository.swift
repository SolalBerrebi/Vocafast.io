import Foundation

struct ImportedWord {
    let word: String
    let translation: String
    let context: String?
}

struct ImportResult {
    let deckId: UUID
    let deckName: String
    let wordCount: Int
    let totalInFile: Int
    let capped: Bool
}

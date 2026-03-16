import Foundation

struct DeckImportMeta {
    let words: [ImportedWord]
    let deckName: String?
    let targetLang: String?
    let icon: String?
    let color: String?
}

enum DeckImporter {
    static func parse(fileContent: String, fileName: String) -> DeckImportMeta {
        let lowerName = fileName.lowercased()

        if lowerName.hasSuffix(".vocafast.json") || lowerName.hasSuffix(".json") {
            return parseJSON(fileContent)
        } else {
            let words = parseCSVTSV(fileContent)
            return DeckImportMeta(words: words, deckName: nil, targetLang: nil, icon: nil, color: nil)
        }
    }

    private static func parseJSON(_ text: String) -> DeckImportMeta {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return DeckImportMeta(words: [], deckName: nil, targetLang: nil, icon: nil, color: nil)
        }

        // Vocafast native format
        if let format = json["format"] as? String, format == "vocafast-v1",
           let wordsArray = json["words"] as? [[String: Any]] {
            let words = wordsArray.compactMap { dict -> ImportedWord? in
                guard let word = dict["word"] as? String, !word.isEmpty,
                      let translation = dict["translation"] as? String, !translation.isEmpty else { return nil }
                return ImportedWord(word: word, translation: translation, context: dict["context"] as? String)
            }
            let deckInfo = json["deck"] as? [String: Any]
            let deckName = deckInfo?["name"] as? String
            let targetLang = deckInfo?["target_lang"] as? String
            let icon = deckInfo?["icon"] as? String
            let color = deckInfo?["color"] as? String
            return DeckImportMeta(words: words, deckName: deckName, targetLang: targetLang, icon: icon, color: color)
        }

        // Plain JSON array
        if let data = text.data(using: .utf8),
           let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            let words = array.compactMap { dict -> ImportedWord? in
                guard let word = dict["word"] as? String, !word.isEmpty,
                      let translation = dict["translation"] as? String, !translation.isEmpty else { return nil }
                return ImportedWord(word: word, translation: translation, context: nil)
            }
            return DeckImportMeta(words: words, deckName: nil, targetLang: nil, icon: nil, color: nil)
        }

        return DeckImportMeta(words: [], deckName: nil, targetLang: nil, icon: nil, color: nil)
    }

    private static func parseCSVTSV(_ text: String) -> [ImportedWord] {
        let lines = text.components(separatedBy: .newlines).filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guard !lines.isEmpty else { return [] }

        // Detect separator
        let firstLine = lines[0]
        let separator: Character
        if firstLine.contains("\t") {
            separator = "\t"
        } else if firstLine.contains(";") {
            separator = ";"
        } else {
            separator = ","
        }

        var words: [ImportedWord] = []

        for line in lines {
            let parts = line.split(separator: separator, omittingEmptySubsequences: false)
                .map { $0.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "\"'")) }

            // Skip header row
            if words.isEmpty && isHeaderRow(parts) { continue }

            if parts.count >= 2, !parts[0].isEmpty, !parts[1].isEmpty {
                words.append(ImportedWord(
                    word: parts[0],
                    translation: parts[1],
                    context: parts.count > 2 ? parts[2] : nil
                ))
            }
        }

        return words
    }

    private static func isHeaderRow(_ parts: [String]) -> Bool {
        let headers: Set<String> = ["word", "translation", "front", "back", "term", "definition", "question", "answer", "context"]
        return parts.contains { headers.contains($0.lowercased()) }
    }
}

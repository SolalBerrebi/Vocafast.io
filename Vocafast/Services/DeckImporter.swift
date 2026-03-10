import Foundation

enum DeckImporter {
    static func parse(fileContent: String, fileName: String) -> (words: [ImportedWord], deckName: String?) {
        let lowerName = fileName.lowercased()

        if lowerName.hasSuffix(".vocafast.json") || lowerName.hasSuffix(".json") {
            return parseJSON(fileContent)
        } else {
            let words = parseCSVTSV(fileContent)
            return (words, nil)
        }
    }

    private static func parseJSON(_ text: String) -> (words: [ImportedWord], deckName: String?) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return ([], nil)
        }

        // Vocafast native format
        if let format = json["format"] as? String, format == "vocafast-v1",
           let wordsArray = json["words"] as? [[String: Any]] {
            let words = wordsArray.compactMap { dict -> ImportedWord? in
                guard let word = dict["word"] as? String, !word.isEmpty,
                      let translation = dict["translation"] as? String, !translation.isEmpty else { return nil }
                return ImportedWord(word: word, translation: translation, context: dict["context"] as? String)
            }
            let deckName = (json["deck"] as? [String: Any])?["name"] as? String
            return (words, deckName)
        }

        // Plain JSON array
        if let data = text.data(using: .utf8),
           let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            let words = array.compactMap { dict -> ImportedWord? in
                guard let word = dict["word"] as? String, !word.isEmpty,
                      let translation = dict["translation"] as? String, !translation.isEmpty else { return nil }
                return ImportedWord(word: word, translation: translation, context: nil)
            }
            return (words, nil)
        }

        return ([], nil)
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

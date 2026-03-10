import Foundation

enum DeckExporter {
    struct ExportData {
        let fileName: String
        let data: Data
        let mimeType: String
    }

    static func exportTSV(deckName: String, words: [Word]) -> ExportData {
        var rows = ["word\ttranslation\tcontext"]
        for w in words {
            let word = escapeTSV(w.word)
            let translation = escapeTSV(w.translation)
            let context = escapeTSV(w.contextSentence ?? "")
            rows.append("\(word)\t\(translation)\t\(context)")
        }
        let content = rows.joined(separator: "\n")
        let fileName = sanitizeFilename(deckName) + ".tsv"
        return ExportData(fileName: fileName, data: Data(content.utf8), mimeType: "text/tab-separated-values")
    }

    static func exportJSON(deckName: String, deckIcon: String, deckColor: String, targetLang: String, words: [Word]) -> ExportData {
        let exportDict: [String: Any] = [
            "format": "vocafast-v1",
            "deck": [
                "name": deckName,
                "icon": deckIcon,
                "color": deckColor,
                "target_lang": targetLang,
            ],
            "words": words.map { w in
                [
                    "word": w.word,
                    "translation": w.translation,
                    "context": w.contextSentence ?? "",
                ]
            },
            "exported_at": Date().iso8601String,
        ]

        let data = (try? JSONSerialization.data(withJSONObject: exportDict, options: [.prettyPrinted, .sortedKeys])) ?? Data()
        let fileName = sanitizeFilename(deckName) + ".vocafast.json"
        return ExportData(fileName: fileName, data: data, mimeType: "application/json")
    }

    private static func escapeTSV(_ value: String) -> String {
        value.replacingOccurrences(of: "\t", with: " ")
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "\r", with: "")
    }

    private static func sanitizeFilename(_ name: String) -> String {
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: " _-"))
        let filtered = name.unicodeScalars.filter { allowed.contains($0) || ($0.value >= 0x0590 && $0.value <= 0x06FF) || ($0.value >= 0x00C0 && $0.value <= 0x024F) }
        let result = String(String.UnicodeScalarView(filtered)).trimmingCharacters(in: .whitespaces)
        return result.isEmpty ? "deck" : result
    }
}

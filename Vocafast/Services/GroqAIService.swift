import Foundation

final class GroqAIService: AIService {
    private let supabase = SupabaseManager.shared.client
    private let model = Config.groqModel

    // MARK: - Text Extraction

    func extractFromText(text: String, nativeLang: String, targetLang: String, includeContext: Bool = false) async throws -> [ExtractedWord] {
        let targetName = Config.languageName(for: targetLang)
        let nativeName = Config.languageName(for: nativeLang)

        let contextFields = includeContext
            ? #", and a "context" field with a short example sentence in \#(targetName) using the word (under 15 words, natural and simple)"#
            : ""

        let prompt = """
        You are a vocabulary extraction assistant for language learners.

        The user is learning \(targetName) and their native language is \(nativeName).

        Analyze the following text and extract useful vocabulary from it. The text may be:
        - A list of words (one per line, comma-separated, etc.)
        - A paragraph or passage in \(targetName) — extract the most useful words/expressions
        - A mix of \(targetName) and \(nativeName) words — organize them into proper pairs
        - Words in any language — always translate so "word" is in \(targetName) and "translation" is in \(nativeName)

        LANGUAGE DETECTION — be smart about which field goes where:
        - For EACH word/phrase in the input, detect its language automatically.
        - Words in \(targetName) → put in "word" field, translate to \(nativeName) for "translation" field.
        - Words in \(nativeName) → put in "translation" field, translate to \(targetName) for "word" field.
        - Words in a third language → translate to both \(targetName) (for "word") and \(nativeName) (for "translation").
        - Do NOT blindly assume the input language. Detect it per-item.

        IMPORTANT RULES:
        - Items can be single words OR multi-word expressions/phrases (e.g. "to get along", "faire la grasse matinée"). Extract natural expressions as-is.
        - "word" MUST be in \(targetName) (the language being learned)
        - "translation" MUST be in \(nativeName) (the user's native language)
        - If the text contains verb conjugations or irregular forms, preserve them
        - Deduplicate entries
        - Maximum 30 items

        Return ONLY a valid JSON array with no other text, no markdown, no code fences. Each element must have "word" and "translation" fields\(contextFields).

        If the text is empty or contains no extractable vocabulary, return an empty array: []\(scriptInstruction(for: targetLang, langName: targetName))\(scriptInstruction(for: nativeLang, langName: nativeName))

        TEXT TO ANALYZE:
        \(text)
        """

        return try await callGroq(prompt: prompt, temperature: 0.2, maxTokens: 4096)
    }

    // MARK: - Image Extraction

    func extractFromImage(base64: String, mimeType: String, nativeLang: String, targetLang: String, includeContext: Bool = false) async throws -> [ExtractedWord] {
        let targetName = Config.languageName(for: targetLang)
        let nativeName = Config.languageName(for: nativeLang)

        let contextFields = includeContext
            ? #", and a "context" field with a short example sentence in \#(targetName) using the word (under 15 words, natural and simple)"#
            : ""

        let prompt = """
        You are a vocabulary extraction assistant for language learners. Analyze this image and extract useful vocabulary from it.

        The image could be ANYTHING from real life — a restaurant menu, a street sign, a product label, a textbook page, a newspaper, a handwritten note, a screenshot, a flash card, or any scene with visible text.

        Your job: Find text in the image and turn it into useful vocabulary for someone learning \(targetName).

        EXTRACTION STRATEGY:
        1. Menus & food items: Extract dish names, ingredients, and food-related words.
        2. Signs & labels: Extract the words/phrases on signs.
        3. Textbook/book pages: Extract the most useful vocabulary words and expressions.
        4. Vocabulary tables or word lists: Extract each row/item as a pair.
        5. Product labels: Extract product names, descriptions, ingredients.
        6. Any other text: Extract the most useful, learnable words.
        7. Scenes with objects: If the image shows objects but no text, name the visible objects as vocabulary.

        IMPORTANT RULES:
        - Items may be single words OR multi-word expressions/phrases. Extract expressions as-is — do NOT split them into individual words.
        - LANGUAGE DETECTION: For EACH word/phrase visible in the image, detect its language automatically:
          - Words in \(targetName) → put in "word" field, translate to \(nativeName) for "translation".
          - Words in \(nativeName) → put in "translation" field, translate to \(targetName) for "word".
          - Words in a third language → translate to both fields appropriately.
        - The "word" field MUST always end up in \(targetName). The "translation" field MUST always end up in \(nativeName).
        - Focus on PRACTICAL vocabulary a language learner would benefit from knowing.

        Return ONLY a valid JSON array with no other text, no markdown, no code fences. Each element must have "word" and "translation" fields\(contextFields).

        If you cannot find any words, return an empty array: []\(scriptInstruction(for: targetLang, langName: targetName))\(scriptInstruction(for: nativeLang, langName: nativeName))
        """

        return try await callGroqMultimodal(prompt: prompt, imageBase64: base64, mimeType: mimeType, temperature: 0.1, maxTokens: 4096)
    }

    // MARK: - Topic Generation

    func generateTopic(topic: String, nativeLang: String, targetLang: String, existingWords: [String], wordCount: Int, level: String?, includeContext: Bool = false) async throws -> [ExtractedWord] {
        let targetName = Config.languageName(for: targetLang)
        let nativeName = Config.languageName(for: nativeLang)
        let count = min(50, max(5, wordCount))

        let excludeClause = existingWords.isEmpty ? "" : "\n- Do NOT include any of these words (the user already has them): \(existingWords.joined(separator: ", "))"

        let levelDescriptions: [String: String] = [
            "starter": "ABSOLUTE BEGINNER level — the very first words someone learns: greetings, numbers 1-10, yes/no, please/thank you, basic survival words. Think day 1 of language learning.",
            "beginner": "BEGINNER level — common everyday words a tourist or early learner would need: basic food, colors, family members, simple verbs (go, eat, want), common adjectives (big, small, good).",
            "intermediate": "INTERMEDIATE level — conversational vocabulary for someone who can hold basic conversations: more nuanced verbs, abstract concepts, workplace terms, opinions and feelings, compound expressions.",
            "advanced": "ADVANCED level — sophisticated vocabulary for fluent conversations: formal/literary words, precise synonyms, technical terms, less common but useful expressions, phrasal verbs with nuance.",
            "native": "NATIVE/IDIOMATIC level — slang, idioms, colloquial expressions, proverbs, cultural references, and words that only a native speaker would naturally use.",
        ]
        let levelInstruction = level.flatMap { levelDescriptions[$0] }.map { "\nVOCABULARY LEVEL: \($0)" } ?? ""

        let contextInstruction = includeContext
            ? "\n\nEXAMPLE SENTENCES: For EACH word, also include a \"context\" field with a short, natural example sentence in \(targetName) that uses the word. The sentence should be simple enough for a learner at the specified level to understand. Keep sentences under 15 words."
            : ""

        let contextFields = includeContext
            ? #", and a "context" field with an example sentence"#
            : ""

        let prompt = """
        You are a vocabulary teacher. Generate exactly \(count) items for the user's request: "\(topic)".\(levelInstruction)\(contextInstruction)

        The "word" field must be in \(targetName). The "translation" field must be in \(nativeName).

        CRITICAL — Interpret the user's request literally:
        - If the user asks for "irregular verbs" in English, generate actual irregular verbs WITH their past tense and past participle forms in the "word" field.
        - If the user asks for "animals", generate actual animal names — NOT words about biology.
        - In short: generate INSTANCES of the category, not META-VOCABULARY about the category.
        - Items can be single words OR multi-word expressions/phrases when natural.

        Additional rules:
        - Choose practical, commonly-used items
        - For regular verbs, use the infinitive form
        - For irregular verbs or conjugation topics, include the irregular/conjugated forms\(excludeClause)

        Return ONLY a valid JSON array with no other text, no markdown, no code fences.
        Each element must have "word" (in \(targetName)) and "translation" (in \(nativeName)) fields\(contextFields).\(scriptInstruction(for: targetLang, langName: targetName))\(scriptInstruction(for: nativeLang, langName: nativeName))
        """

        let maxTokens = count > 20 ? 4096 : 2048
        return try await callGroq(prompt: prompt, temperature: 0.3, maxTokens: includeContext ? 4096 : maxTokens)
    }

    // MARK: - Script Instructions

    /// Returns an explicit instruction for non-Latin script languages to prevent romanization.
    private func scriptInstruction(for langCode: String, langName: String) -> String {
        switch langCode {
        case "ja":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using Japanese characters (kanji, hiragana, or katakana as appropriate). NEVER use romaji or Latin letters for Japanese words. Example: write 猫 not \"neko\", write ありがとう not \"arigatou\"."
        case "zh":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using simplified Chinese characters (汉字). NEVER use pinyin or Latin letters. Example: write 猫 not \"māo\", write 谢谢 not \"xièxie\"."
        case "ko":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using Hangul (한글). NEVER use romanization. Example: write 고양이 not \"goyangi\"."
        case "ru":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using Cyrillic script. NEVER use Latin transliteration. Example: write кошка not \"koshka\"."
        case "ar":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using Arabic script (العربية). NEVER use Latin transliteration. Example: write قطة not \"qitta\"."
        case "he":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using Hebrew script (עברית). NEVER use Latin transliteration. Example: write חתול not \"chatul\"."
        case "hi":
            return "\n\nSCRIPT REQUIREMENT: Write ALL \(langName) words using Devanagari script (देवनागरी). NEVER use Latin transliteration. Example: write बिल्ली not \"billi\"."
        default:
            return ""
        }
    }

    // MARK: - Private Helpers

    private func callGroq(prompt: String, temperature: Double, maxTokens: Int) async throws -> [ExtractedWord] {
        let body: [String: Any] = [
            "model": model,
            "messages": [["role": "user", "content": prompt]],
            "temperature": temperature,
            "max_tokens": maxTokens,
        ]

        let data = try await makeRequest(body: body)
        return try parseResponse(data)
    }

    private func callGroqMultimodal(prompt: String, imageBase64: String, mimeType: String, temperature: Double, maxTokens: Int) async throws -> [ExtractedWord] {
        let body: [String: Any] = [
            "model": model,
            "messages": [[
                "role": "user",
                "content": [
                    ["type": "text", "text": prompt],
                    ["type": "image_url", "image_url": ["url": "data:\(mimeType);base64,\(imageBase64)"]],
                ],
            ]],
            "temperature": temperature,
            "max_tokens": maxTokens,
        ]

        let data = try await makeRequest(body: body)
        return try parseResponse(data)
    }

    private func makeRequest(body: [String: Any]) async throws -> Data {
        let jsonData = try JSONSerialization.data(withJSONObject: body)

        let data: Data = try await supabase.functions.invoke(
            "ai-proxy",
            options: .init(
                headers: ["Content-Type": "application/json"],
                body: jsonData
            )
        ) { data, _ in data }

        // Check for error responses
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let error = json["error"] as? [String: Any],
           let message = error["message"] as? String {
            throw AIError.apiError(message)
        }
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let errorMsg = json["error"] as? String {
            throw AIError.apiError(errorMsg)
        }

        return data
    }

    private func parseResponse(_ data: Data) throws -> [ExtractedWord] {
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let choices = json["choices"] as? [[String: Any]],
              let message = choices.first?["message"] as? [String: Any],
              let content = message["content"] as? String else {
            throw AIError.noResponse
        }

        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { throw AIError.noResponse }

        // Strip code fences if present
        let cleaned = trimmed
            .replacingOccurrences(of: "```json", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let jsonData = cleaned.data(using: .utf8) else {
            throw AIError.parseError
        }

        let pairs = try JSONDecoder().decode([ExtractedWord].self, from: jsonData)

        return pairs
            .filter { !$0.word.isEmpty && $0.word.count < 200 && !$0.translation.isEmpty }
    }
}

enum AIError: LocalizedError {
    case invalidURL
    case networkError
    case apiError(String)
    case noResponse
    case parseError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid API URL"
        case .networkError: return "Network error. Check your connection."
        case .apiError(let msg): return "AI error: \(msg)"
        case .noResponse: return "No response from AI. Try again."
        case .parseError: return "Could not parse vocabulary from response."
        }
    }
}

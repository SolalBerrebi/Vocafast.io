import Foundation
import Supabase

final class WordRepository {
    private let supabase = SupabaseManager.shared.client

    func fetchAll(deckId: UUID) async throws -> [Word] {
        try await supabase
            .from("words")
            .select()
            .eq("deck_id", value: deckId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func fetchExistingWords(deckId: UUID) async throws -> [String] {
        struct Row: Decodable { let word: String }
        let rows: [Row] = try await supabase
            .from("words")
            .select("word")
            .eq("deck_id", value: deckId)
            .execute()
            .value
        return rows.map(\.word)
    }

    func fetchDue(deckId: UUID, limit: Int = 20) async throws -> [Word] {
        let now = Date().iso8601String
        return try await supabase
            .from("words")
            .select()
            .eq("deck_id", value: deckId)
            .lte("next_review_at", value: now)
            .order("next_review_at")
            .limit(limit)
            .execute()
            .value
    }

    func fetchNew(deckId: UUID, limit: Int = 10) async throws -> [Word] {
        try await supabase
            .from("words")
            .select()
            .eq("deck_id", value: deckId)
            .eq("repetitions", value: 0)
            .order("created_at")
            .limit(limit)
            .execute()
            .value
    }

    func fetchAllLimited(deckId: UUID, limit: Int = 50) async throws -> [Word] {
        try await supabase
            .from("words")
            .select()
            .eq("deck_id", value: deckId)
            .order("created_at")
            .limit(limit)
            .execute()
            .value
    }

    func fetchMistakes(deckId: UUID, limit: Int = 20) async throws -> [Word] {
        let lowEase: [Word] = try await supabase
            .from("words")
            .select()
            .eq("deck_id", value: deckId)
            .lt("ease_factor", value: 2.2)
            .gt("repetitions", value: 0)
            .order("ease_factor")
            .limit(limit)
            .execute()
            .value

        let resetWords: [Word] = try await supabase
            .from("words")
            .select()
            .eq("deck_id", value: deckId)
            .eq("repetitions", value: 0)
            .lt("ease_factor", value: 2.5)
            .neq("interval_days", value: 0)
            .order("ease_factor")
            .limit(limit)
            .execute()
            .value

        var seen = Set<UUID>()
        var result: [Word] = []
        for word in lowEase + resetWords {
            if seen.insert(word.id).inserted {
                result.append(word)
            }
        }
        return Array(result.prefix(limit))
    }

    struct DeckStats {
        let total: Int
        let due: Int
        let newCount: Int
        let learning: Int
        let mastered: Int
    }

    func fetchDeckStats(deckId: UUID) async throws -> DeckStats {
        struct Row: Decodable {
            let repetitions: Int
            let nextReviewAt: String
            let intervalDays: Int
            enum CodingKeys: String, CodingKey {
                case repetitions
                case nextReviewAt = "next_review_at"
                case intervalDays = "interval_days"
            }
        }
        let rows: [Row] = try await supabase
            .from("words")
            .select("repetitions, next_review_at, interval_days")
            .eq("deck_id", value: deckId)
            .execute()
            .value

        let now = Date().iso8601String
        let total = rows.count
        let newCount = rows.filter { $0.repetitions == 0 }.count
        let due = rows.filter { $0.repetitions > 0 && $0.nextReviewAt <= now }.count
        let mastered = rows.filter { $0.intervalDays >= 21 }.count
        let learning = total - newCount - mastered

        return DeckStats(total: total, due: due, newCount: newCount, learning: learning, mastered: mastered)
    }

    func countMastered(deckIds: [UUID]) async throws -> Int {
        struct Row: Decodable { let id: UUID }
        let rows: [Row] = try await supabase
            .from("words")
            .select("id")
            .in("deck_id", values: deckIds.map(\.uuidString))
            .gte("repetitions", value: 3)
            .execute()
            .value
        return rows.count
    }

    func add(deckId: UUID, word: String, translation: String, context: String?, sourceType: WordSourceType) async throws -> Word {
        var params: [String: AnyJSON] = [
            "deck_id": .string(deckId.uuidString),
            "word": .string(word),
            "translation": .string(translation),
            "source_type": .string(sourceType.rawValue),
        ]
        if let context, !context.isEmpty {
            params["context_sentence"] = .string(context)
        }
        return try await supabase
            .from("words")
            .insert(params)
            .select()
            .single()
            .execute()
            .value
    }

    struct BatchWord: Encodable {
        let deckId: String
        let word: String
        let translation: String
        let sourceType: String
        let contextSentence: String?

        enum CodingKeys: String, CodingKey {
            case deckId = "deck_id"
            case word, translation
            case sourceType = "source_type"
            case contextSentence = "context_sentence"
        }
    }

    func addBatch(deckId: UUID, words: [(word: String, translation: String)], sourceType: WordSourceType) async throws -> [Word] {
        let batchSize = 100
        var allInserted: [Word] = []

        for i in stride(from: 0, to: words.count, by: batchSize) {
            let batch = Array(words[i..<min(i + batchSize, words.count)])
            let rows = batch.map { item in
                BatchWord(
                    deckId: deckId.uuidString,
                    word: item.word,
                    translation: item.translation,
                    sourceType: sourceType.rawValue,
                    contextSentence: nil
                )
            }
            let inserted: [Word] = try await supabase
                .from("words")
                .insert(rows)
                .select()
                .execute()
                .value
            allInserted.append(contentsOf: inserted)
        }

        return allInserted
    }

    func update(id: UUID, word: String, translation: String, context: String?) async throws -> Word {
        var params: [String: AnyJSON] = [
            "word": .string(word),
            "translation": .string(translation),
        ]
        params["context_sentence"] = context.map { .string($0) } ?? .null
        return try await supabase
            .from("words")
            .update(params)
            .eq("id", value: id)
            .select()
            .single()
            .execute()
            .value
    }

    func updateSRS(id: UUID, easeFactor: Double, interval: Int, repetitions: Int, nextReviewAt: String) async throws {
        try await supabase
            .from("words")
            .update([
                "ease_factor": AnyJSON.double(easeFactor),
                "interval_days": AnyJSON.integer(interval),
                "repetitions": AnyJSON.integer(repetitions),
                "next_review_at": AnyJSON.string(nextReviewAt),
            ])
            .eq("id", value: id)
            .execute()
    }

    func delete(id: UUID) async throws {
        try await supabase
            .from("words")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    func deleteBatch(ids: [UUID]) async throws {
        try await supabase
            .from("words")
            .delete()
            .in("id", values: ids.map(\.uuidString))
            .execute()
    }
}

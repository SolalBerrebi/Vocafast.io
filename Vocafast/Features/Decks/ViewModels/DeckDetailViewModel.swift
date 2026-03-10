import SwiftUI

@MainActor
final class DeckDetailViewModel: ObservableObject {
    @Published var deck: Deck?
    @Published var words: [Word] = []
    @Published var isLoading = false
    @Published var searchText = ""
    @Published var isSelectMode = false
    @Published var selectedWordIds: Set<UUID> = []
    @Published var editingWord: Word?

    private let deckRepo = DeckRepository()
    private let wordRepo = WordRepository()

    var filteredWords: [Word] {
        if searchText.isEmpty { return words }
        let query = searchText.lowercased()
        return words.filter {
            $0.word.lowercased().contains(query) || $0.translation.lowercased().contains(query)
        }
    }

    var showSearchBar: Bool {
        words.count > 5
    }

    // MARK: - Fetch

    func fetchDeckAndWords(deckId: UUID) async {
        isLoading = true
        do {
            async let deckFetch = deckRepo.fetch(id: deckId)
            async let wordsFetch = wordRepo.fetchAll(deckId: deckId)
            deck = try await deckFetch
            words = try await wordsFetch
        } catch {
            // Silently fail
        }
        isLoading = false
    }

    // MARK: - Word Operations

    func deleteWord(id: UUID) async {
        do {
            try await wordRepo.delete(id: id)
            words.removeAll { $0.id == id }
            HapticsManager.success()
        } catch {
            HapticsManager.error()
        }
    }

    func deleteBulk() async {
        let ids = Array(selectedWordIds)
        guard !ids.isEmpty else { return }

        do {
            try await wordRepo.deleteBatch(ids: ids)
            words.removeAll { ids.contains($0.id) }
            selectedWordIds.removeAll()
            isSelectMode = false
            HapticsManager.success()
        } catch {
            HapticsManager.error()
        }
    }

    func updateWord(id: UUID, word: String, translation: String, context: String?) async {
        do {
            let updated = try await wordRepo.update(id: id, word: word, translation: translation, context: context)
            if let index = words.firstIndex(where: { $0.id == id }) {
                words[index] = updated
            }
            HapticsManager.success()
        } catch {
            HapticsManager.error()
        }
    }

    func selectAll() {
        selectedWordIds = Set(filteredWords.map(\.id))
    }

    func deselectAll() {
        selectedWordIds.removeAll()
    }

    func toggleSelection(id: UUID) {
        if selectedWordIds.contains(id) {
            selectedWordIds.remove(id)
        } else {
            selectedWordIds.insert(id)
        }
    }

    // MARK: - Export

    func exportTSV() -> DeckExporter.ExportData? {
        guard let deck else { return nil }
        return DeckExporter.exportTSV(deckName: deck.name, words: words)
    }

    func exportJSON(targetLang: String) -> DeckExporter.ExportData? {
        guard let deck else { return nil }
        return DeckExporter.exportJSON(
            deckName: deck.name,
            deckIcon: deck.icon,
            deckColor: deck.color,
            targetLang: targetLang,
            words: words
        )
    }
}

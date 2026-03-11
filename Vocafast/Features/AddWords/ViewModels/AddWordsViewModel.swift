import SwiftUI
import UIKit

@MainActor
final class AddWordsViewModel: ObservableObject {
    let deckId: UUID

    // Manual entry
    @Published var manualWord = ""
    @Published var manualTranslation = ""
    @Published var manualContext = ""

    // Photo
    @Published var selectedImage: UIImage?
    @Published var showCamera = false
    @Published var showGallery = false

    // Text extraction
    @Published var inputText = ""

    // Topics
    @Published var topicInput = ""
    @Published var selectedLevel = "beginner"
    @Published var topicWordCount: Double = 15

    // Shared state
    @Published var extractedWords: [ExtractedWord] = []
    @Published var recentlyAdded: [Word] = []
    @Published var isLoading = false
    @Published var loadingMessage = ""
    @Published var errorMessage: String?
    @Published var showCoachMark = false

    private let wordRepo = WordRepository()
    private let profileRepo = ProfileRepository()
    private let envRepo = EnvironmentRepository()
    private let deckRepo = DeckRepository()
    private let aiService = GroqAIService()
    private var existingWords: Set<String> = []

    var existingWordCount: String {
        let count = existingWords.count
        if count == 0 { return "" }
        return "\(count) word\(count == 1 ? "" : "s") already in this deck"
    }

    let quickTopics = [
        ("Greetings", "👋"), ("Food", "🍕"), ("Travel", "✈️"), ("Technology", "💻"),
        ("Work", "💼"), ("Health", "🏥"), ("Home", "🏠"), ("Nature", "🌿"),
        ("Shopping", "🛍️"), ("Time", "⏰"),
    ]

    let levels = [
        ("starter", "Starter"),
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("native", "Native"),
    ]

    init(deckId: UUID) {
        self.deckId = deckId
        if !CoachMarkStore.isDismissed("add_words") {
            showCoachMark = true
        }
    }

    // MARK: - Load Existing Words (for dedup)

    func loadExistingWords() async {
        do {
            let words = try await wordRepo.fetchExistingWords(deckId: deckId)
            existingWords = Set(words.map { $0.lowercased() })
        } catch {}
    }

    private func getLanguages() async throws -> (nativeLang: String, targetLang: String) {
        let envId = try await deckRepo.getEnvironmentId(deckId: deckId)
        let targetLang = try await envRepo.getTargetLang(envId: envId)
        let nativeLang = try await profileRepo.getNativeLang()
        return (nativeLang, targetLang)
    }

    // MARK: - Manual Add

    func addManualWord() async {
        guard !manualWord.isEmpty, !manualTranslation.isEmpty else {
            errorMessage = "Please enter both word and translation."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let word = try await wordRepo.add(
                deckId: deckId,
                word: manualWord.trimmingCharacters(in: .whitespaces),
                translation: manualTranslation.trimmingCharacters(in: .whitespaces),
                context: manualContext.isEmpty ? nil : manualContext.trimmingCharacters(in: .whitespaces),
                sourceType: .manual
            )
            recentlyAdded.insert(word, at: 0)
            existingWords.insert(manualWord.lowercased())
            manualWord = ""
            manualTranslation = ""
            manualContext = ""
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
            HapticsManager.error()
        }

        isLoading = false
    }

    // MARK: - Photo Extraction

    func processImage(_ image: UIImage) async {
        selectedImage = image
        isLoading = true
        loadingMessage = "Preparing image..."
        errorMessage = nil

        guard let compressed = ImageCompressor.compress(image) else {
            errorMessage = "Failed to process image."
            isLoading = false
            return
        }

        loadingMessage = "Analyzing image with AI..."

        do {
            let (nativeLang, targetLang) = try await getLanguages()
            var words = try await aiService.extractFromImage(
                base64: compressed.base64,
                mimeType: compressed.mimeType,
                nativeLang: nativeLang,
                targetLang: targetLang
            )
            words = dedup(words)

            if words.isEmpty {
                errorMessage = "No vocabulary found in this image. Try a clearer image."
            }

            extractedWords = words
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
        loadingMessage = ""
    }

    // MARK: - Text Extraction

    func extractFromText() async {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Please enter some text."
            return
        }

        isLoading = true
        loadingMessage = "Extracting vocabulary..."
        errorMessage = nil

        do {
            let (nativeLang, targetLang) = try await getLanguages()
            var words = try await aiService.extractFromText(
                text: inputText,
                nativeLang: nativeLang,
                targetLang: targetLang
            )
            words = dedup(words)

            if words.isEmpty {
                errorMessage = "No vocabulary found. Try different text."
            }

            extractedWords = words
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
        loadingMessage = ""
    }

    // MARK: - Topic Generation

    func generateTopic(_ topic: String) async {
        isLoading = true
        loadingMessage = "Generating vocabulary..."
        errorMessage = nil

        do {
            let (nativeLang, targetLang) = try await getLanguages()
            var words = try await aiService.generateTopic(
                topic: topic,
                nativeLang: nativeLang,
                targetLang: targetLang,
                existingWords: Array(existingWords),
                wordCount: Int(topicWordCount),
                level: selectedLevel
            )
            words = dedup(words)

            if words.isEmpty {
                errorMessage = "No vocabulary generated. Try a different topic."
            }

            extractedWords = words
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
        loadingMessage = ""
    }

    // MARK: - Save Selected Words

    func saveSelected(sourceType: WordSourceType) async {
        let selected = extractedWords.filter(\.isSelected)
        guard !selected.isEmpty else { return }

        isLoading = true
        errorMessage = nil

        do {
            let words = try await wordRepo.addBatch(
                deckId: deckId,
                words: selected.map { ($0.word, $0.translation) },
                sourceType: sourceType
            )
            recentlyAdded.insert(contentsOf: words, at: 0)
            for w in selected {
                existingWords.insert(w.word.lowercased())
            }
            extractedWords.removeAll()
            selectedImage = nil
            inputText = ""
            HapticsManager.success()
        } catch {
            errorMessage = error.localizedDescription
            HapticsManager.error()
        }

        isLoading = false
    }

    // MARK: - Helpers

    func toggleWordSelection(id: UUID) {
        if let index = extractedWords.firstIndex(where: { $0.id == id }) {
            extractedWords[index].isSelected.toggle()
        }
    }

    func clearExtracted() {
        extractedWords.removeAll()
        selectedImage = nil
        inputText = ""
        errorMessage = nil
    }

    private func dedup(_ words: [ExtractedWord]) -> [ExtractedWord] {
        words.filter { !existingWords.contains($0.word.lowercased()) }
    }
}

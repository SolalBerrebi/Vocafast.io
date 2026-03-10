import SwiftUI

@MainActor
final class OnboardingViewModel: ObservableObject {
    @Published var selectedNativeLang: String?
    @Published var selectedTargetLang: String?
    @Published var deckName = ""
    @Published var selectedTopic: String?
    @Published var selectedLevel = "beginner"
    @Published var wordCount: Double = 15
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let profileRepo = ProfileRepository()
    private let envRepo = EnvironmentRepository()
    private let deckRepo = DeckRepository()
    private let wordRepo = WordRepository()
    private let aiService = GroqAIService()

    let presetTopics = [
        ("Basics", "🔤"),
        ("Travel", "✈️"),
        ("Food", "🍕"),
        ("Business", "💼"),
        ("Daily Life", "🏠"),
    ]

    let levels = [
        ("starter", "Starter"),
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("native", "Native"),
    ]

    // MARK: - Save Native Language

    func saveNativeLang() async -> Bool {
        guard let lang = selectedNativeLang else {
            errorMessage = "Please select a language."
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            try await profileRepo.updateNativeLang(lang)
            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Save Target Language & Create Environment

    func saveTargetLang() async -> Bool {
        guard let lang = selectedTargetLang else {
            errorMessage = "Please select a language."
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            let flag = Config.languageFlag(for: lang)
            _ = try await envRepo.create(targetLang: lang, color: "#007AFF", icon: flag, isActive: true)
            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Create First Deck

    func createFirstDeck(appState: AppState) async -> Bool {
        let name = selectedTopic ?? deckName
        guard !name.isEmpty else {
            errorMessage = "Please choose a topic or enter a deck name."
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            // Fetch the environment
            let envs = try await envRepo.fetchAll()
            guard let env = envs.first(where: { $0.isActive }) ?? envs.first else {
                errorMessage = "No language environment found."
                isLoading = false
                return false
            }

            // Create deck
            let deck = try await deckRepo.create(
                environmentId: env.id,
                name: name,
                color: "#007AFF",
                icon: "📚"
            )

            // Generate words if a preset topic was selected
            if selectedTopic != nil {
                do {
                    let nativeLang = try await profileRepo.getNativeLang()
                    let words = try await aiService.generateTopic(
                        topic: name,
                        nativeLang: nativeLang,
                        targetLang: env.targetLang,
                        existingWords: [],
                        wordCount: Int(wordCount),
                        level: selectedLevel
                    )

                    if !words.isEmpty {
                        _ = try await wordRepo.addBatch(
                            deckId: deck.id,
                            words: words.map { ($0.word, $0.translation) },
                            sourceType: .topic
                        )
                    }
                } catch {
                    // Topic generation failed — continue with empty deck
                }
            }

            // Complete onboarding
            try await profileRepo.completeOnboarding()

            // Refresh app state
            await appState.checkOnboardingAndLoad()

            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    var availableTargetLanguages: [(code: String, flag: String, name: String)] {
        Config.supportedLanguages.filter { $0.code != selectedNativeLang }
    }
}

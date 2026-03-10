import Foundation

enum Config {
    // MARK: - Supabase
    static let supabaseURL = URL(string: "YOUR_SUPABASE_URL")!
    static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"

    // MARK: - Groq AI
    static let groqAPIKey = "YOUR_GROQ_API_KEY"
    static let groqModel = "meta-llama/llama-4-scout-17b-16e-instruct"
    static let groqBaseURL = "https://api.groq.com/openai/v1/chat/completions"

    // MARK: - Language Names
    static let languageNames: [String: String] = [
        "en": "English",
        "he": "Hebrew",
        "fr": "French",
        "es": "Spanish",
        "ar": "Arabic",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ja": "Japanese",
        "ko": "Korean",
        "zh": "Chinese",
        "ru": "Russian",
        "hi": "Hindi",
        "nl": "Dutch",
        "sv": "Swedish",
        "pl": "Polish",
        "tr": "Turkish",
    ]

    // MARK: - Supported Languages (with flags)
    static let supportedLanguages: [(code: String, flag: String, name: String)] = [
        ("en", "🇬🇧", "English"),
        ("he", "🇮🇱", "Hebrew"),
        ("fr", "🇫🇷", "French"),
        ("es", "🇪🇸", "Spanish"),
        ("ar", "🇸🇦", "Arabic"),
        ("de", "🇩🇪", "German"),
        ("it", "🇮🇹", "Italian"),
        ("pt", "🇵🇹", "Portuguese"),
        ("ja", "🇯🇵", "Japanese"),
        ("ko", "🇰🇷", "Korean"),
        ("zh", "🇨🇳", "Chinese"),
        ("ru", "🇷🇺", "Russian"),
        ("hi", "🇮🇳", "Hindi"),
        ("nl", "🇳🇱", "Dutch"),
        ("sv", "🇸🇪", "Swedish"),
        ("pl", "🇵🇱", "Polish"),
        ("tr", "🇹🇷", "Turkish"),
    ]

    static func languageName(for code: String) -> String {
        languageNames[code] ?? code
    }

    static func languageFlag(for code: String) -> String {
        supportedLanguages.first(where: { $0.code == code })?.flag ?? "🌍"
    }
}

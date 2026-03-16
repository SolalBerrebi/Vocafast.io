import Foundation

final class LocalizationManager {
    static let shared = LocalizationManager()

    var language: String = "en"

    private static let supportedUILanguages: Set<String> = ["en", "fr", "es"]

    static func resolveUILanguage(for nativeLang: String) -> String {
        supportedUILanguages.contains(nativeLang) ? nativeLang : "en"
    }
}

/// Shorthand localization function. Returns the translated string for the current language.
func L(_ key: String) -> String {
    Translations.string(for: key, language: LocalizationManager.shared.language)
}

/// Localization with format arguments (e.g. `LF("key", 5)` for `"%d words"`)
func LF(_ key: String, _ args: CVarArg...) -> String {
    let format = Translations.string(for: key, language: LocalizationManager.shared.language)
    return String(format: format, arguments: args)
}

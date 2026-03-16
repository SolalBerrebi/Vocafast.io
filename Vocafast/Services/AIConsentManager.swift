import Foundation

final class AIConsentManager {
    static let shared = AIConsentManager()

    private let key = "ai_data_consent_granted"

    var hasConsented: Bool {
        UserDefaults.standard.bool(forKey: key)
    }

    func grantConsent() {
        UserDefaults.standard.set(true, forKey: key)
    }

    func revokeConsent() {
        UserDefaults.standard.set(false, forKey: key)
    }
}

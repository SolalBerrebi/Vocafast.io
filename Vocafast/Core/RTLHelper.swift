import SwiftUI

enum RTLHelper {
    private static let rtlLanguages: Set<String> = ["he", "ar"]

    static func isRTL(_ langCode: String) -> Bool {
        rtlLanguages.contains(langCode)
    }

    static func textAlignment(for langCode: String) -> TextAlignment {
        isRTL(langCode) ? .trailing : .leading
    }

    static func layoutDirection(for langCode: String) -> LayoutDirection {
        isRTL(langCode) ? .rightToLeft : .leftToRight
    }
}

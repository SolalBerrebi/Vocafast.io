import SwiftUI

struct PronounceButton: View {
    let text: String
    let language: String
    var size: CGFloat = 28
    var iconSize: Font = .caption

    var body: some View {
        Button {
            SpeechService.shared.speak(text, language: language)
            HapticsManager.light()
        } label: {
            Image(systemName: "speaker.wave.2.fill")
                .font(iconSize)
                .foregroundStyle(Color.accentColor)
                .frame(width: size, height: size)
                .background(Color.accentColor.opacity(0.1))
                .clipShape(Circle())
        }
        .buttonStyle(.plain)
    }
}

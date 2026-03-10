import SwiftUI

struct CoachMarkView: View {
    let text: String
    let onDismiss: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Arrow pointing up
            Triangle()
                .fill(Color(.systemGray6))
                .frame(width: 20, height: 10)

            Text(text)
                .font(.subheadline)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemGray6))
                )
        }
        .onTapGesture {
            onDismiss()
        }
        .transition(.opacity.combined(with: .scale(scale: 0.9)))
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

enum CoachMarkStore {
    private static let prefix = "coachmark_dismissed_"

    static func isDismissed(_ key: String) -> Bool {
        UserDefaults.standard.bool(forKey: prefix + key)
    }

    static func dismiss(_ key: String) {
        UserDefaults.standard.set(true, forKey: prefix + key)
    }
}

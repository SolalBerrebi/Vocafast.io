import SwiftUI

struct AIConsentSheet: View {
    let onAccept: () -> Void
    let onDecline: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Icon
                    Image(systemName: "cpu.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.blue)
                        .padding(.top, 20)

                    // Title
                    Text(L("ai_consent_title"))
                        .font(.title2.bold())

                    Text(L("ai_consent_subtitle"))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    // Data cards
                    VStack(spacing: 16) {
                        DataCard(
                            icon: "paperplane.fill",
                            color: .blue,
                            title: L("ai_consent_sent_title"),
                            description: L("ai_consent_sent_desc")
                        )

                        DataCard(
                            icon: "shield.checkered",
                            color: .green,
                            title: L("ai_consent_used_title"),
                            description: L("ai_consent_used_desc")
                        )

                        DataCard(
                            icon: "hand.raised.fill",
                            color: .orange,
                            title: L("ai_consent_choice_title"),
                            description: L("ai_consent_choice_desc")
                        )
                    }
                    .padding(.horizontal)

                    Spacer(minLength: 20)
                }
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 12) {
                    Button {
                        AIConsentManager.shared.grantConsent()
                        onAccept()
                    } label: {
                        Text(L("ai_consent_agree"))
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)

                    Button {
                        onDecline()
                    } label: {
                        Text(L("ai_consent_decline"))
                            .font(.subheadline)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Data Card

private struct DataCard: View {
    let icon: String
    let color: Color
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

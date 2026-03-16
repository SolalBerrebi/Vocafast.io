import SwiftUI

struct AIDataUsageView: View {
    var body: some View {
        List {
            Section(L("ai_data_how_title")) {
                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(L("ai_data_vocab_gen"))
                            .font(.subheadline.weight(.medium))
                        Text(L("ai_data_vocab_gen_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "text.badge.star")
                        .foregroundStyle(.blue)
                }

                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(L("ai_data_text_extract"))
                            .font(.subheadline.weight(.medium))
                        Text(L("ai_data_text_extract_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "doc.text")
                        .foregroundStyle(.blue)
                }

                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(L("ai_data_photo_capture"))
                            .font(.subheadline.weight(.medium))
                        Text(L("ai_data_photo_capture_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "camera")
                        .foregroundStyle(.blue)
                }
            }

            Section(L("ai_data_provider_title")) {
                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(L("ai_data_provider_name"))
                            .font(.subheadline.weight(.medium))
                        Text(L("ai_data_provider_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "cpu")
                        .foregroundStyle(.purple)
                }
            }

            Section(L("ai_data_your_data_title")) {
                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(L("ai_data_not_training"))
                            .font(.subheadline.weight(.medium))
                        Text(L("ai_data_not_training_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "lock.shield")
                        .foregroundStyle(.green)
                }

                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(L("ai_data_in_control"))
                            .font(.subheadline.weight(.medium))
                        Text(L("ai_data_in_control_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "hand.raised")
                        .foregroundStyle(.orange)
                }
            }
        }
        .navigationTitle(L("settings_ai_data"))
        .navigationBarTitleDisplayMode(.inline)
    }
}

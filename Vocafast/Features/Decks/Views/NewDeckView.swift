import SwiftUI

struct NewDeckView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = NewDeckViewModel()
    @Environment(\.dismiss) private var dismiss

    var onCreated: ((UUID) -> Void)?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // MARK: - Live Preview Card
                VStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color(hex: viewModel.selectedColor).opacity(0.25),
                                        Color(hex: viewModel.selectedColor).opacity(0.08),
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(height: 160)

                        VStack(spacing: 10) {
                            Text(viewModel.selectedIcon)
                                .font(.system(size: 52))
                                .shadow(color: Color(hex: viewModel.selectedColor).opacity(0.3), radius: 8, y: 4)

                            Text(viewModel.name.isEmpty ? L("new_deck_name_placeholder") : viewModel.name)
                                .font(.title3.bold())
                                .foregroundStyle(viewModel.name.isEmpty ? .secondary : .primary)
                                .lineLimit(1)
                        }
                    }
                    .animation(.easeInOut(duration: 0.2), value: viewModel.selectedColor)
                    .animation(.easeInOut(duration: 0.2), value: viewModel.selectedIcon)
                }
                .padding(.horizontal, 16)

                // MARK: - Name Field
                VStack(alignment: .leading, spacing: 6) {
                    Text(L("new_deck_name"))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 20)

                    TextField(L("new_deck_name_placeholder"), text: $viewModel.name)
                        .font(.body)
                        .padding(14)
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .padding(.horizontal, 16)
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 20)
                }

                // MARK: - Color Picker
                VStack(alignment: .leading, spacing: 10) {
                    Text(L("new_deck_color"))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 20)

                    HStack(spacing: 0) {
                        ForEach(viewModel.colors, id: \.self) { color in
                            Button {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    viewModel.selectedColor = color
                                }
                                HapticsManager.selection()
                            } label: {
                                ZStack {
                                    Circle()
                                        .fill(Color(hex: color))
                                        .frame(width: 34, height: 34)

                                    if viewModel.selectedColor == color {
                                        Circle()
                                            .stroke(Color(.systemBackground), lineWidth: 3)
                                            .frame(width: 34, height: 34)
                                        Circle()
                                            .stroke(Color(hex: color), lineWidth: 2.5)
                                            .frame(width: 40, height: 40)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                }

                // MARK: - Icon Picker
                VStack(alignment: .leading, spacing: 10) {
                    Text(L("new_deck_icon"))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 20)

                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 8), spacing: 6) {
                        ForEach(viewModel.icons, id: \.self) { icon in
                            Button {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    viewModel.selectedIcon = icon
                                }
                                HapticsManager.selection()
                            } label: {
                                Text(icon)
                                    .font(.title3)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 40)
                                    .background(
                                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                                            .fill(viewModel.selectedIcon == icon
                                                  ? Color(hex: viewModel.selectedColor).opacity(0.15)
                                                  : Color.clear)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                                            .stroke(viewModel.selectedIcon == icon
                                                    ? Color(hex: viewModel.selectedColor)
                                                    : Color.clear, lineWidth: 2)
                                    )
                            }
                        }
                    }
                    .padding(12)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .padding(.horizontal, 16)
                }

            }
            .padding(.top, 8)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(L("new_deck_title"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button {
                    Task {
                        if let deck = await viewModel.createDeck(environmentId: appState.activeEnvironmentId) {
                            onCreated?(deck.id)
                            dismiss()
                        }
                    }
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                    } else {
                        Text(L("new_deck_create"))
                            .fontWeight(.semibold)
                    }
                }
                .disabled(viewModel.isLoading || viewModel.name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }
}

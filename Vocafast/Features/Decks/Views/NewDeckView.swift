import SwiftUI

struct NewDeckView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = NewDeckViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var createdDeckId: UUID?
    @State private var navigateToDetail = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Preview
                HStack(spacing: 12) {
                    Text(viewModel.selectedIcon)
                        .font(.largeTitle)
                        .frame(width: 64, height: 64)
                        .background(Color(hex: viewModel.selectedColor).opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 16))

                    VStack(alignment: .leading) {
                        Text(viewModel.name.isEmpty ? "New Deck" : viewModel.name)
                            .font(.title3.bold())
                        Text("0 words")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(.horizontal, 24)

                // Name
                VStack(alignment: .leading, spacing: 8) {
                    Text("Name")
                        .font(.headline)
                    TextField("Enter deck name", text: $viewModel.name)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal, 24)

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 24)
                }

                // Colors
                VStack(alignment: .leading, spacing: 8) {
                    Text("Color")
                        .font(.headline)
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 12) {
                        ForEach(viewModel.colors, id: \.self) { color in
                            Circle()
                                .fill(Color(hex: color))
                                .frame(width: 36, height: 36)
                                .overlay(
                                    Circle()
                                        .stroke(Color.primary, lineWidth: viewModel.selectedColor == color ? 3 : 0)
                                        .padding(2)
                                )
                                .onTapGesture {
                                    viewModel.selectedColor = color
                                    HapticsManager.selection()
                                }
                        }
                    }
                }
                .padding(.horizontal, 24)

                // Icons
                VStack(alignment: .leading, spacing: 8) {
                    Text("Icon")
                        .font(.headline)
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                        ForEach(viewModel.icons, id: \.self) { icon in
                            Text(icon)
                                .font(.title2)
                                .frame(width: 48, height: 48)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(viewModel.selectedIcon == icon ? Color.accentColor.opacity(0.15) : Color(.systemGray6))
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(viewModel.selectedIcon == icon ? Color.accentColor : Color.clear, lineWidth: 2)
                                )
                                .onTapGesture {
                                    viewModel.selectedIcon = icon
                                    HapticsManager.selection()
                                }
                        }
                    }
                }
                .padding(.horizontal, 24)
            }
            .padding(.vertical, 16)
        }
        .navigationTitle("New Deck")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button {
                    Task {
                        if let deck = await viewModel.createDeck(environmentId: appState.activeEnvironmentId) {
                            createdDeckId = deck.id
                            navigateToDetail = true
                        }
                    }
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                    } else {
                        Text("Create")
                            .fontWeight(.semibold)
                    }
                }
                .disabled(viewModel.isLoading)
            }
        }
        .navigationDestination(isPresented: $navigateToDetail) {
            if let deckId = createdDeckId {
                DeckDetailView(deckId: deckId)
            }
        }
    }
}

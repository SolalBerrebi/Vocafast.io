import SwiftUI

struct DeckDetailView: View {
    let deckId: UUID
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = DeckDetailViewModel()
    @State private var showExportMenu = false
    @State private var exportFileURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.words.isEmpty {
                // Empty state
                VStack(spacing: 24) {
                    Text("No words yet")
                        .font(.title2.bold())
                    Text("Add vocabulary using one of these methods:")
                        .foregroundStyle(.secondary)

                    VStack(spacing: 12) {
                        EmptyMethodCard(icon: "pencil", title: "Manual", description: "Type words one by one")
                        EmptyMethodCard(icon: "camera", title: "Photo", description: "Capture from textbooks")
                        EmptyMethodCard(icon: "doc.text", title: "Text", description: "Paste and extract")
                        EmptyMethodCard(icon: "sparkles", title: "Topics", description: "AI-generated vocabulary")
                    }

                    NavigationLink {
                        AddWordsView(deckId: deckId)
                    } label: {
                        Text("Add Words")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .foregroundStyle(.white)
                            .background(Color.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 24)
            } else {
                VStack(spacing: 0) {
                    // Search bar
                    if viewModel.showSearchBar {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(.secondary)
                            TextField("Search words...", text: $viewModel.searchText)
                                .autocapitalization(.none)
                        }
                        .padding(10)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                    }

                    // Bulk delete bar
                    if viewModel.isSelectMode {
                        HStack {
                            Button(viewModel.selectedWordIds.count == viewModel.filteredWords.count ? "Deselect All" : "Select All") {
                                if viewModel.selectedWordIds.count == viewModel.filteredWords.count {
                                    viewModel.deselectAll()
                                } else {
                                    viewModel.selectAll()
                                }
                            }
                            Spacer()
                            if !viewModel.selectedWordIds.isEmpty {
                                Button("Delete \(viewModel.selectedWordIds.count) Words") {
                                    Task { await viewModel.deleteBulk() }
                                }
                                .foregroundStyle(.red)
                                .fontWeight(.semibold)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                    }

                    // Word list
                    List {
                        ForEach(viewModel.filteredWords) { word in
                            if viewModel.isSelectMode {
                                HStack {
                                    Image(systemName: viewModel.selectedWordIds.contains(word.id) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(viewModel.selectedWordIds.contains(word.id) ? Color.accentColor : .secondary)
                                    WordRowView(word: word)
                                }
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    viewModel.toggleSelection(id: word.id)
                                    HapticsManager.selection()
                                }
                            } else {
                                WordRowView(word: word)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        viewModel.editingWord = word
                                    }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
        }
        .navigationTitle(viewModel.deck?.name ?? "Deck")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if !viewModel.words.isEmpty {
                    // Select mode toggle
                    Button {
                        viewModel.isSelectMode.toggle()
                        if !viewModel.isSelectMode {
                            viewModel.selectedWordIds.removeAll()
                        }
                    } label: {
                        Image(systemName: viewModel.isSelectMode ? "xmark.circle" : "checkmark.circle")
                    }

                    // Export
                    Menu {
                        Button("Export TSV") {
                            exportAs(format: .tsv)
                        }
                        Button("Export JSON") {
                            exportAs(format: .json)
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }

                    // Add words
                    NavigationLink {
                        AddWordsView(deckId: deckId)
                    } label: {
                        Image(systemName: "plus")
                    }

                    // Train
                    NavigationLink {
                        TrainingLauncherView(deckId: deckId)
                    } label: {
                        Image(systemName: "play.fill")
                    }
                }
            }
        }
        .sheet(item: $viewModel.editingWord) { word in
            EditWordSheet(word: word) { updatedWord, updatedTranslation, updatedContext in
                Task {
                    await viewModel.updateWord(
                        id: word.id,
                        word: updatedWord,
                        translation: updatedTranslation,
                        context: updatedContext
                    )
                }
            } onDelete: {
                Task {
                    await viewModel.deleteWord(id: word.id)
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            if let url = exportFileURL {
                ShareSheet(items: [url])
            }
        }
        .task {
            await viewModel.fetchDeckAndWords(deckId: deckId)
        }
    }

    private enum ExportFormat { case tsv, json }

    private func exportAs(format: ExportFormat) {
        let exportData: DeckExporter.ExportData?
        switch format {
        case .tsv:
            exportData = viewModel.exportTSV()
        case .json:
            exportData = viewModel.exportJSON(targetLang: appState.activeEnvironment?.targetLang ?? "")
        }

        guard let export = exportData else { return }
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(export.fileName)
        try? export.data.write(to: tempURL)
        exportFileURL = tempURL
        showShareSheet = true
    }
}

struct EmptyMethodCard: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .frame(width: 40, height: 40)
                .background(Color.accentColor.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .foregroundStyle(Color.accentColor)

            VStack(alignment: .leading) {
                Text(title).font(.subheadline.bold())
                Text(description).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color(.systemGray6)))
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

import SwiftUI
import SwiftData

struct DownloadedDecksView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \CachedDeck.name) private var cachedDecks: [CachedDeck]
    @State private var pendingReviewCount = 0
    @State private var editMode: EditMode = .inactive
    @State private var selectedIds: Set<UUID> = []

    private var isSelecting: Bool {
        editMode == .active
    }

    var body: some View {
        List(selection: $selectedIds) {
            // Pending sync info
            if pendingReviewCount > 0 && !isSelecting {
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .foregroundStyle(.orange)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(LF("downloads_pending_reviews", pendingReviewCount))
                                .font(.subheadline)
                            Text(L("downloads_pending_desc"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button(L("downloads_sync_now")) {
                            Task {
                                await OfflineDeckManager.shared.syncPendingReviews(context: modelContext)
                                refreshPendingCount()
                            }
                        }
                        .font(.subheadline.weight(.medium))
                    }
                }
            }

            // Downloaded decks
            if cachedDecks.isEmpty {
                Section {
                    VStack(spacing: 12) {
                        Image(systemName: "arrow.down.circle")
                            .font(.system(size: 36))
                            .foregroundStyle(.secondary)
                        Text(L("downloads_empty"))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                }
            } else {
                Section(L("downloads_decks_section")) {
                    ForEach(cachedDecks, id: \.id) { deck in
                        HStack(spacing: 12) {
                            Text(deck.icon)
                                .font(.title3)
                                .frame(width: 36, height: 36)
                                .background(Color(hex: deck.color).opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: 8))

                            VStack(alignment: .leading, spacing: 2) {
                                Text(deck.name)
                                    .font(.subheadline.weight(.medium))

                                let wordCount = OfflineDeckManager.shared.cachedWordCount(deckId: deck.id, context: modelContext)
                                Text(LF("downloads_word_count", wordCount))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            if !isSelecting {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.green)
                                    .font(.body)
                            }
                        }
                        .tag(deck.id)
                    }
                    .onDelete(perform: deleteDecks)
                }

                // Remove all (only when not selecting)
                if !isSelecting {
                    Section {
                        Button(L("downloads_remove_all"), role: .destructive) {
                            for deck in cachedDecks {
                                OfflineDeckManager.shared.removeDeck(deckId: deck.id, context: modelContext)
                            }
                            HapticsManager.light()
                        }
                    }
                }
            }
        }
        .environment(\.editMode, $editMode)
        .navigationTitle(L("settings_manage_downloads"))
        .toolbar {
            if !cachedDecks.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        withAnimation {
                            if isSelecting {
                                editMode = .inactive
                                selectedIds.removeAll()
                            } else {
                                editMode = .active
                            }
                        }
                    } label: {
                        Text(isSelecting ? L("common_done") : L("downloads_select"))
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            // Delete selected bar
            if isSelecting && !selectedIds.isEmpty {
                Button(role: .destructive) {
                    deleteSelected()
                } label: {
                    Text(LF("downloads_remove_selected", selectedIds.count))
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .foregroundStyle(.white)
                        .background(Color.red)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
                .background(.ultraThinMaterial)
            }
        }
        .onAppear {
            refreshPendingCount()
        }
    }

    private func deleteDecks(at offsets: IndexSet) {
        for index in offsets {
            let deck = cachedDecks[index]
            OfflineDeckManager.shared.removeDeck(deckId: deck.id, context: modelContext)
        }
        HapticsManager.light()
    }

    private func deleteSelected() {
        for id in selectedIds {
            OfflineDeckManager.shared.removeDeck(deckId: id, context: modelContext)
        }
        selectedIds.removeAll()
        editMode = .inactive
        HapticsManager.light()
    }

    private func refreshPendingCount() {
        let descriptor = FetchDescriptor<PendingReview>()
        pendingReviewCount = (try? modelContext.fetchCount(descriptor)) ?? 0
    }
}

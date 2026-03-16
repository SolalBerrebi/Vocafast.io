import SwiftUI
import UIKit

struct AddWordsView: View {
    let deckId: UUID
    @StateObject private var viewModel: AddWordsViewModel
    @State private var selectedMethod: CaptureMethod? = nil
    @State private var showAIConsent = false
    @State private var pendingAIMethod: CaptureMethod?
    @State private var navigateToTraining = false

    enum CaptureMethod: Hashable {
        case topic, photo, text, manual
    }

    init(deckId: UUID) {
        self.deckId = deckId
        _viewModel = StateObject(wrappedValue: AddWordsViewModel(deckId: deckId))
    }

    private func selectMethod(_ method: CaptureMethod) {
        let aiMethods: Set<CaptureMethod> = [.topic, .photo, .text]
        if aiMethods.contains(method) && !AIConsentManager.shared.hasConsented {
            pendingAIMethod = method
            showAIConsent = true
        } else {
            withAnimation(.easeInOut(duration: 0.2)) {
                selectedMethod = method
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 16) {
                    if viewModel.showSaveSuccess {
                        saveSuccessView
                    } else if selectedMethod == nil {
                        methodPicker
                    } else {
                        switch selectedMethod {
                        case .topic:
                            TopicGenerationSection(viewModel: viewModel)
                        case .photo:
                            PhotoCaptureSection(viewModel: viewModel)
                        case .text:
                            TextExtractionSection(viewModel: viewModel)
                        case .manual:
                            ManualEntrySection(viewModel: viewModel)
                        case .none:
                            EmptyView()
                        }
                    }

                    // Recently added
                    if !viewModel.recentlyAdded.isEmpty && !viewModel.showSaveSuccess {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(L("add_words_recently_added"))
                                .font(.headline)
                                .padding(.horizontal, 16)

                            ForEach(viewModel.recentlyAdded.prefix(10)) { word in
                                HStack {
                                    Text(word.word)
                                        .fontWeight(.medium)
                                    Spacer()
                                    Text(word.translation)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 6)
                            }
                        }
                        .padding(.top, 8)
                    }
                }
                .padding(.vertical, 16)
            }
        }
        .navigationTitle(viewModel.showSaveSuccess ? L("add_words_saved_title") : (selectedMethod == nil ? L("add_words_title") : methodTitle))
        .navigationBarBackButtonHidden(selectedMethod != nil && !viewModel.showSaveSuccess)
        .toolbar {
            if selectedMethod != nil && !viewModel.showSaveSuccess {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedMethod = nil
                            viewModel.clearExtracted()
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .fontWeight(.semibold)
                            Text(L("add_words_all_methods"))
                        }
                    }
                }
            }
        }
        .navigationDestination(isPresented: $navigateToTraining) {
            TrainingLauncherView(deckId: deckId)
        }
        .sheet(isPresented: $showAIConsent) {
            AIConsentSheet(
                onAccept: {
                    showAIConsent = false
                    if let method = pendingAIMethod {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedMethod = method
                        }
                        pendingAIMethod = nil
                    }
                },
                onDecline: {
                    showAIConsent = false
                    pendingAIMethod = nil
                }
            )
        }
        .task {
            await viewModel.loadExistingWords()
        }
    }

    private var methodTitle: String {
        switch selectedMethod {
        case .topic: return L("add_words_topic_title")
        case .photo: return L("add_words_photo_title")
        case .text: return L("add_words_text_title")
        case .manual: return L("add_words_manual_title")
        case .none: return L("add_words_title")
        }
    }

    // MARK: - Save Success

    private var saveSuccessView: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)

            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.12))
                    .frame(width: 80, height: 80)
                Image(systemName: "checkmark")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(.green)
            }

            VStack(spacing: 8) {
                Text(viewModel.lastSaveCount == 1 ? L("add_words_one_saved") : LF("add_words_many_saved", viewModel.lastSaveCount))
                    .font(.title2.bold())
                Text(L("add_words_ready_practice"))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 12) {
                Button {
                    navigateToTraining = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "play.fill")
                        Text(L("add_words_train_now"))
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .foregroundStyle(.white)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        viewModel.dismissSuccess()
                    }
                } label: {
                    Text(L("add_words_add_more"))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Color.accentColor)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Method Picker

    private var methodPicker: some View {
        VStack(spacing: 12) {
            // Subtitle
            Text(L("add_words_subtitle"))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 4)

            // PRIMARY: Topic Generation
            Button {
                selectMethod(.topic)
            } label: {
                HStack(alignment: .top, spacing: 14) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.blue)
                            .frame(width: 44, height: 44)
                        Image(systemName: "sparkles")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text(L("add_words_topic_title"))
                                .font(.body.weight(.bold))
                                .foregroundStyle(.primary)
                            Text(L("add_words_badge_fastest"))
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.blue)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        Text(L("add_words_topic_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.blue.opacity(0.06))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(Color.blue.opacity(0.15), lineWidth: 1.5)
                        )
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)

            // PRIMARY: Photo Scan
            Button {
                selectMethod(.photo)
            } label: {
                HStack(alignment: .top, spacing: 14) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.orange)
                            .frame(width: 44, height: 44)
                        Image(systemName: "camera.fill")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text(L("add_words_photo_title"))
                                .font(.body.weight(.bold))
                                .foregroundStyle(.primary)
                            Text(L("add_words_badge_magic"))
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.orange)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.orange.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        Text(L("add_words_photo_desc"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.orange.opacity(0.06))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(Color.orange.opacity(0.15), lineWidth: 1.5)
                        )
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)

            // SECONDARY ROW: Text + Manual
            HStack(spacing: 10) {
                // Paste Text
                Button {
                    selectMethod(.text)
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.green)
                                .frame(width: 36, height: 36)
                            Image(systemName: "doc.text")
                                .font(.body.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                        Text(L("add_words_text_title"))
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.primary)
                        Text(L("add_words_text_desc"))
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                            .lineLimit(2)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(UIColor.systemBackground))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(Color(UIColor.separator), lineWidth: 0.5)
                            )
                    )
                }
                .buttonStyle(.plain)

                // Manual
                Button {
                    selectMethod(.manual)
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.purple)
                                .frame(width: 36, height: 36)
                            Image(systemName: "pencil.line")
                                .font(.body.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                        Text(L("add_words_manual_title"))
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.primary)
                        Text(L("add_words_manual_desc"))
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                            .lineLimit(2)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(UIColor.systemBackground))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(Color(UIColor.separator), lineWidth: 0.5)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)

            // Example sentences toggle
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(L("add_words_examples_title"))
                        .font(.subheadline.weight(.semibold))
                    Text(L("add_words_examples_desc"))
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                Spacer()
                Toggle("", isOn: $viewModel.includeExamples)
                    .labelsHidden()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color(UIColor.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .strokeBorder(Color(UIColor.separator), lineWidth: 0.5)
                    )
            )
            .padding(.horizontal, 16)

            // Deck word count
            if !viewModel.existingWordCount.isEmpty {
                Text(viewModel.existingWordCount)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .padding(.top, 4)
            }
        }
    }
}

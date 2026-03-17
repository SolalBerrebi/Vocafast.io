import SwiftUI
import UniformTypeIdentifiers

struct VoiceCaptureSection: View {
    @ObservedObject var viewModel: AddWordsViewModel
    @ObservedObject private var speech = SpeechService.shared
    @EnvironmentObject var appState: AppState
    @State private var hasPermission = false
    @State private var showPermissionAlert = false
    @State private var showFilePicker = false

    var body: some View {
        VStack(spacing: 16) {
            if viewModel.extractedWords.isEmpty && !viewModel.isLoading {
                // Description
                Text(L("voice_desc"))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)

                // Microphone button
                if !speech.isProcessing && (speech.transcript.isEmpty || speech.isRecording) {
                    VStack(spacing: 16) {
                        Button {
                            if speech.isRecording {
                                speech.stopRecording()
                            } else {
                                startRecording()
                            }
                        } label: {
                            ZStack {
                                if speech.isRecording {
                                    Circle()
                                        .stroke(Color.red.opacity(0.3), lineWidth: 3)
                                        .frame(width: 100, height: 100)
                                        .scaleEffect(1.3)
                                        .opacity(0)
                                        .animation(.easeOut(duration: 1.2).repeatForever(autoreverses: false), value: speech.isRecording)
                                }

                                Circle()
                                    .fill(speech.isRecording ? Color.red : Color.accentColor)
                                    .frame(width: 80, height: 80)

                                Image(systemName: speech.isRecording ? "stop.fill" : "mic.fill")
                                    .font(.system(size: 30, weight: .semibold))
                                    .foregroundStyle(.white)
                            }
                        }
                        .buttonStyle(.plain)

                        Text(speech.isRecording ? L("voice_listening") : L("voice_tap_to_record"))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        // Live partial transcript while recording
                        if speech.isRecording && !speech.transcript.isEmpty {
                            Text(speech.transcript)
                                .font(.callout)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)
                        }
                    }
                    .padding(.vertical, 16)

                    // Import audio button
                    Button {
                        showFilePicker = true
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "waveform")
                                .font(.subheadline)
                            Text(L("voice_import_audio"))
                                .font(.subheadline.weight(.medium))
                        }
                        .foregroundStyle(Color.accentColor)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color.accentColor.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal, 16)
                }

                // Processing state
                if speech.isProcessing {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text(L("voice_processing"))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 24)
                }

                // Transcript ready — show extract button
                if !speech.isRecording && !speech.isProcessing && !speech.transcript.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L("voice_transcript"))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)

                        Text(speech.transcript)
                            .font(.body)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal, 16)

                    HStack(spacing: 12) {
                        Button(L("voice_record_again")) {
                            speech.transcript = ""
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color(.systemGray5))
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                        Button {
                            viewModel.inputText = speech.transcript
                            Task { await viewModel.extractFromText() }
                        } label: {
                            Text(L("voice_extract"))
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .foregroundStyle(.white)
                                .background(Color.accentColor)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(.horizontal, 16)
                }

                // Error
                if let error = speech.recordingError ?? viewModel.errorMessage {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 16)
                }
            }

            // Loading (AI extraction)
            if viewModel.isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                    Text(viewModel.loadingMessage)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 24)
            }

            // Extracted words
            if !viewModel.extractedWords.isEmpty {
                WordReviewList(
                    words: $viewModel.extractedWords,
                    onToggle: viewModel.toggleWordSelection
                )

                HStack(spacing: 12) {
                    Button(L("common_clear")) {
                        viewModel.clearExtracted()
                        speech.transcript = ""
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color(.systemGray5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        Task { await viewModel.saveSelected(sourceType: .text) }
                    } label: {
                        Text(L("voice_save_selected"))
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .foregroundStyle(.white)
                            .background(Color.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .task {
            hasPermission = await SpeechService.requestSpeechPermission()
        }
        .alert(L("voice_permission_title"), isPresented: $showPermissionAlert) {
            Button(L("common_cancel"), role: .cancel) {}
        } message: {
            Text(L("voice_permission_message"))
        }
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [UTType.audio, UTType.mpeg4Audio, UTType.mp3, UTType.wav],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                guard url.startAccessingSecurityScopedResource() else { return }
                let lang = appState.activeEnvironment?.targetLang ?? "en"
                speech.transcribeFile(url: url, language: lang)
                url.stopAccessingSecurityScopedResource()
            case .failure:
                break
            }
        }
    }

    private func startRecording() {
        guard hasPermission else {
            showPermissionAlert = true
            return
        }
        let lang = appState.activeEnvironment?.targetLang ?? "en"
        speech.startRecording(language: lang)
    }
}

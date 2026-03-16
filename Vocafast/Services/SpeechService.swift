import AVFoundation
import Speech

@MainActor
final class SpeechService: ObservableObject {
    static let shared = SpeechService()

    private let synthesizer = AVSpeechSynthesizer()

    // MARK: - Text-to-Speech (Pronunciation)

    func speak(_ text: String, language: String) {
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: voiceLocale(for: language))
        utterance.rate = 0.42
        utterance.pitchMultiplier = 1.0
        utterance.preUtteranceDelay = 0.05
        synthesizer.speak(utterance)
    }

    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
    }

    // MARK: - Speech-to-Text (Live Recording)

    private var audioEngine: AVAudioEngine?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?

    @Published var isRecording = false
    @Published var isProcessing = false
    @Published var transcript = ""
    @Published var recordingError: String?

    static func requestSpeechPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
    }

    func startRecording(language: String) {
        // Reset state
        transcript = ""
        recordingError = nil
        isProcessing = false

        let locale = Locale(identifier: voiceLocale(for: language))
        guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
            recordingError = "Speech recognition not available for this language."
            return
        }

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            recordingError = "Could not configure audio session."
            return
        }

        let engine = AVAudioEngine()
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        let inputNode = engine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            request.append(buffer)
        }

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            Task { @MainActor in
                guard let self else { return }

                if let result {
                    self.transcript = result.bestTranscription.formattedString
                    if result.isFinal {
                        self.finishRecognition()
                    }
                }

                if let error, self.isRecording || self.isProcessing {
                    // Only treat as error if we don't already have a transcript
                    if self.transcript.isEmpty {
                        self.recordingError = error.localizedDescription
                    }
                    self.finishRecognition()
                }
            }
        }

        do {
            engine.prepare()
            try engine.start()
            audioEngine = engine
            recognitionRequest = request
            isRecording = true
        } catch {
            recordingError = "Could not start audio engine."
            cleanup()
        }
    }

    func stopRecording() {
        guard isRecording else { return }
        isRecording = false
        isProcessing = true

        // Stop capturing audio
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine = nil

        // Signal end of audio — let recognizer deliver final result
        recognitionRequest?.endAudio()

        // Safety timeout: if final result doesn't arrive in 3 seconds, finish with what we have
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            if self.isProcessing {
                self.finishRecognition()
            }
        }
    }

    private func finishRecognition() {
        isProcessing = false
        isRecording = false
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
    }

    private func cleanup() {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        isRecording = false
        isProcessing = false
    }

    // MARK: - Transcribe Audio File

    func transcribeFile(url: URL, language: String) {
        transcript = ""
        recordingError = nil
        isProcessing = true

        let locale = Locale(identifier: voiceLocale(for: language))
        guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
            recordingError = "Speech recognition not available for this language."
            isProcessing = false
            return
        }

        let request = SFSpeechURLRecognitionRequest(url: url)
        request.shouldReportPartialResults = false

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            Task { @MainActor in
                guard let self else { return }

                if let result {
                    self.transcript = result.bestTranscription.formattedString
                }

                if error != nil && self.transcript.isEmpty {
                    self.recordingError = "Could not transcribe audio file."
                }

                self.isProcessing = false
                self.recognitionTask = nil
            }
        }
    }

    // MARK: - Locale Mapping

    func voiceLocale(for code: String) -> String {
        switch code {
        case "en": return "en-US"
        case "he": return "he-IL"
        case "fr": return "fr-FR"
        case "es": return "es-ES"
        case "ar": return "ar-SA"
        case "de": return "de-DE"
        case "it": return "it-IT"
        case "pt": return "pt-BR"
        case "ja": return "ja-JP"
        case "ko": return "ko-KR"
        case "zh": return "zh-CN"
        case "ru": return "ru-RU"
        case "hi": return "hi-IN"
        case "nl": return "nl-NL"
        case "sv": return "sv-SE"
        case "pl": return "pl-PL"
        case "tr": return "tr-TR"
        default: return "en-US"
        }
    }
}

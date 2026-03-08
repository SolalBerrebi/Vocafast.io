export interface ExtractedWord {
  word: string;
  translation: string;
}

export interface ExtractionResult {
  words: ExtractedWord[];
  raw_text?: string;
}

export interface AIProvider {
  extractVocabulary(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult>;

  extractFromImage(
    imageBase64: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult>;

  transcribeAudio(audioBase64: string): Promise<string>;

  chat(
    messages: ChatMessage[],
    systemPrompt: string,
  ): Promise<string>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

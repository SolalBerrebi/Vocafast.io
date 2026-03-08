import type { AIProvider, ExtractionResult } from "@/types/ai";

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || "";

async function translate(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const body: Record<string, string> = {
    q: text,
    source,
    target,
  };
  if (LIBRETRANSLATE_API_KEY) {
    body.api_key = LIBRETRANSLATE_API_KEY;
  }

  const res = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LibreTranslate error: ${error}`);
  }

  const data = await res.json();
  return data.translatedText;
}

function splitIntoEntries(text: string): string[] {
  return text
    .split(/[\n,;\t]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && w.length < 200);
}

const libretranslateProvider: AIProvider = {
  async extractVocabulary(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult> {
    const entries = splitIntoEntries(text);
    const uniqueEntries = [...new Set(entries)].slice(0, 20);

    // Batch translate: send all words in one request separated by newlines,
    // then split the result. Falls back to individual requests if batch fails.
    try {
      const batchText = uniqueEntries.join("\n");
      const batchResult = await translate(batchText, targetLang, sourceLang);
      const translations = batchResult.split("\n");

      if (translations.length === uniqueEntries.length) {
        const words = uniqueEntries.map((word, i) => ({
          word,
          translation: translations[i].trim(),
        }));
        return { words, raw_text: text };
      }
    } catch {
      // Fall through to individual translation
    }

    // Individual translation fallback
    const words = await Promise.all(
      uniqueEntries.map(async (word) => {
        const translation = await translate(word, targetLang, sourceLang);
        return { word, translation };
      }),
    );

    return { words, raw_text: text };
  },

  async extractFromImage(): Promise<ExtractionResult> {
    throw new Error(
      "Image extraction is not yet supported with LibreTranslate. This feature will use browser-based OCR in a future update.",
    );
  },

  async transcribeAudio(): Promise<string> {
    throw new Error(
      "Audio transcription is not yet supported with LibreTranslate. This feature will use the Web Speech API in a future update.",
    );
  },

  async chat(): Promise<string> {
    throw new Error(
      "Conversation mode is not yet supported with LibreTranslate.",
    );
  },
};

export default libretranslateProvider;

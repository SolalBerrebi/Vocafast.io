import type { AIProvider, ExtractionResult, ChatMessage } from "@/types/ai";
import { extractVocabularyPrompt, imageExtractionPrompt } from "./prompts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1";

async function anthropicRequest(body: Record<string, unknown>) {
  const res = await fetch(`${ANTHROPIC_API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  return res.json();
}

function parseWordsFromResponse(text: string): ExtractionResult {
  try {
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const words = JSON.parse(match[0]);
      return { words, raw_text: text };
    }
  } catch {
    // Fall through
  }
  return { words: [], raw_text: text };
}

const anthropicProvider: AIProvider = {
  async extractVocabulary(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult> {
    const data = await anthropicRequest({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: extractVocabularyPrompt(sourceLang, targetLang),
      messages: [{ role: "user", content: text }],
    });
    return parseWordsFromResponse(data.content[0].text);
  },

  async extractFromImage(
    imageBase64: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult> {
    const data = await anthropicRequest({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: imageExtractionPrompt(sourceLang, targetLang),
            },
          ],
        },
      ],
    });
    return parseWordsFromResponse(data.content[0].text);
  },

  async transcribeAudio(): Promise<string> {
    throw new Error(
      "Audio transcription not supported by Anthropic provider. Use OpenAI for transcription.",
    );
  },

  async chat(
    messages: ChatMessage[],
    systemPrompt: string,
  ): Promise<string> {
    const data = await anthropicRequest({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
    return data.content[0].text;
  },
};

export default anthropicProvider;

import type { AIProvider, ExtractionResult, ChatMessage } from "@/types/ai";
import {
  extractVocabularyPrompt,
  imageExtractionPrompt,
} from "./prompts";

const OPENAI_API_URL = "https://api.openai.com/v1";

async function openaiRequest(
  endpoint: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${OPENAI_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  return res.json();
}

function parseWordsFromResponse(text: string): ExtractionResult {
  try {
    // Try to extract JSON array from response
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

const openaiProvider: AIProvider = {
  async extractVocabulary(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult> {
    const data = await openaiRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: extractVocabularyPrompt(sourceLang, targetLang) },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    });
    return parseWordsFromResponse(data.choices[0].message.content);
  },

  async extractFromImage(
    imageBase64: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<ExtractionResult> {
    const data = await openaiRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: imageExtractionPrompt(sourceLang, targetLang) },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      temperature: 0.3,
    });
    return parseWordsFromResponse(data.choices[0].message.content);
  },

  async transcribeAudio(audioBase64: string): Promise<string> {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([audioBuffer], { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");

    const res = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await res.json();
    return data.text;
  },

  async chat(
    messages: ChatMessage[],
    systemPrompt: string,
  ): Promise<string> {
    const data = await openaiRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
    });
    return data.choices[0].message.content;
  },
};

export default openaiProvider;

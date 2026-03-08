import { NextResponse } from "next/server";
import { TOPICS } from "@/lib/ai/topics";

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || "";

async function translate(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const body: Record<string, string> = { q: text, source, target };
  if (LIBRETRANSLATE_API_KEY) body.api_key = LIBRETRANSLATE_API_KEY;

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

export async function POST(request: Request) {
  try {
    const { topicId, nativeLang, targetLang } = await request.json();

    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
    }

    // Translate English words to target language (the word to learn)
    const batchTarget = topic.words.join("\n");
    const targetResult = await translate(batchTarget, "en", targetLang);
    const targetWords = targetResult.split("\n");

    // Translate English words to native language (the translation/meaning)
    let nativeWords: string[];
    if (nativeLang === "en") {
      nativeWords = topic.words;
    } else {
      const batchNative = topic.words.join("\n");
      const nativeResult = await translate(batchNative, "en", nativeLang);
      nativeWords = nativeResult.split("\n");
    }

    const words = topic.words.map((_, i) => ({
      word: targetWords[i]?.trim() ?? topic.words[i],
      translation: nativeWords[i]?.trim() ?? topic.words[i],
    }));

    return NextResponse.json({ words, topic: topic.name });
  } catch (error) {
    console.error("Topic generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate topic vocabulary" },
      { status: 500 },
    );
  }
}

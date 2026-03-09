import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  he: "Hebrew",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ru: "Russian",
  hi: "Hindi",
  nl: "Dutch",
  sv: "Swedish",
  pl: "Polish",
  tr: "Turkish",
};

function getLangName(code: string) {
  return LANG_NAMES[code] ?? code;
}

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const { topic, nativeLang, targetLang } = await request.json();

    if (!topic || !targetLang || !nativeLang) {
      return NextResponse.json(
        { error: "Missing topic, targetLang, or nativeLang" },
        { status: 400 },
      );
    }

    const targetName = getLangName(targetLang);
    const nativeName = getLangName(nativeLang);

    const prompt = `You are a vocabulary teacher. Generate 12-15 useful vocabulary words for the topic: "${topic}".

The words should be in ${targetName} with translations in ${nativeName}.

Rules:
- Choose practical, commonly-used words for this topic
- Include a mix of nouns, verbs, and adjectives when relevant
- Words should be appropriate for a language learner (not too obscure)
- For ${targetName}, use the most common/standard form of each word

Return ONLY a valid JSON array with no other text, no markdown, no code fences.
Each element must have "word" (in ${targetName}) and "translation" (in ${nativeName}) fields.

Example format: [{"word":"שלום","translation":"hello"},{"word":"תודה","translation":"thank you"}]`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Groq API error:", res.status, errorBody);
      let detail = "Unknown error";
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed.error?.message || errorBody.slice(0, 300);
      } catch {
        detail = errorBody.slice(0, 300);
      }
      return NextResponse.json(
        { error: `AI error: ${detail}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 422 },
      );
    }

    // Parse JSON (strip code fences if present)
    const jsonStr = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let words: { word: string; translation: string }[] = [];
    try {
      words = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Groq response:", text);
      return NextResponse.json(
        { error: "Could not parse vocabulary" },
        { status: 422 },
      );
    }

    const filtered = words.filter(
      (w) =>
        w.word &&
        w.translation &&
        w.word.length > 0 &&
        w.word.length < 100 &&
        w.translation.length > 0,
    );

    return NextResponse.json({ words: filtered, topic });
  } catch (error) {
    console.error("Topic generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate vocabulary" },
      { status: 500 },
    );
  }
}

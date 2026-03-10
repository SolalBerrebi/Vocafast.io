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
        { error: "GROQ_API_KEY is not configured. Get a free key at console.groq.com" },
        { status: 500 },
      );
    }

    const { imageBase64, mimeType, targetLang, nativeLang } =
      await request.json();

    if (!imageBase64 || !targetLang || !nativeLang) {
      return NextResponse.json(
        { error: "Missing imageBase64, targetLang, or nativeLang" },
        { status: 400 },
      );
    }

    const targetName = getLangName(targetLang);
    const nativeName = getLangName(nativeLang);

    const prompt = `You are a vocabulary extraction assistant. Analyze this image which may contain a vocabulary table, word list, flash card, text, signs, labels, or objects.

Extract all word-translation pairs you can find.

IMPORTANT RULES:
- Items may be single words OR multi-word expressions/phrases (e.g. "to take off", "faire la grasse matinée", "להוציא לפועל"). Extract expressions as-is — do NOT split them into individual words.
- The "word" field must be in ${targetName} (the language being learned). The "translation" field MUST be in ${nativeName} (the user's native language).
- If a word in the image is already in ${nativeName}, put it in "translation" and provide the ${targetName} equivalent in "word".
- If the image shows translations in a third language (neither ${targetName} nor ${nativeName}), re-translate so that "translation" is always in ${nativeName}.

Extraction guidelines:
- If the image contains a table with columns, extract each row as a pair.
- If the image contains a list of words without translations, provide the ${nativeName} translation for each word.
- If the image contains text/paragraph, extract the key vocabulary words and expressions, then translate them.
- If the image shows a flash card with a word or expression, extract it as a single entry.

Return ONLY a valid JSON array with no other text, no markdown, no code fences. Each element must have "word" and "translation" fields.
Example: [{"word":"שלום","translation":"hello"},{"word":"לקחת הפסקה","translation":"to take a break"}]

If you cannot find any words, return an empty array: []`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
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
        { error: `Groq API error: ${detail}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No response from Groq. Try a clearer image." },
        { status: 422 },
      );
    }

    // Parse JSON from response (strip code fences if present)
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
        { error: "Could not parse vocabulary from image" },
        { status: 422 },
      );
    }

    // Filter valid entries
    const filtered = words.filter(
      (w) =>
        w.word &&
        w.translation &&
        w.word.length > 0 &&
        w.word.length < 100 &&
        w.translation.length > 0,
    );

    return NextResponse.json({ words: filtered });
  } catch (error) {
    console.error("Image extraction error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 },
    );
  }
}

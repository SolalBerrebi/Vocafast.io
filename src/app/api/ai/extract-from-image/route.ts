import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-4-scout-17b-16e-instruct";

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

    const prompt = `You are a vocabulary extraction assistant. Analyze this image which contains a vocabulary table, word list, or text with words and their translations.

Extract all word-translation pairs you can find. The words should be in ${targetName} and translations in ${nativeName}.

If the image contains a table with columns, extract each row as a pair.
If the image contains a list of words without translations, provide the ${nativeName} translation for each word.
If the image contains text/paragraph, extract the key vocabulary words and translate them.

Return ONLY a valid JSON array with no other text, no markdown, no code fences. Each element must have "word" and "translation" fields.
Example: [{"word":"שלום","translation":"hello"},{"word":"תודה","translation":"thank you"}]

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

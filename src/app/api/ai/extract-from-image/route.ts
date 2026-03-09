import { NextRequest, NextResponse } from "next/server";

// Allow larger request body for image uploads and longer execution for Gemini API
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

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
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Gemini API error:", res.status, errorBody);
      // Surface the actual error so we can diagnose
      let detail = "Unknown Gemini error";
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed.error?.message || errorBody.slice(0, 200);
      } catch {
        detail = errorBody.slice(0, 200);
      }
      return NextResponse.json(
        { error: `Gemini API error: ${detail}` },
        { status: 502 },
      );
    }

    const data = await res.json();

    // Check for blocked/empty responses
    if (!data.candidates || data.candidates.length === 0) {
      const reason = data.promptFeedback?.blockReason || "No response from Gemini";
      console.error("Gemini empty response:", JSON.stringify(data));
      return NextResponse.json(
        { error: `Gemini returned no results: ${reason}` },
        { status: 422 },
      );
    }

    const text =
      data.candidates[0]?.content?.parts?.[0]?.text ?? "";

    // Parse JSON from Gemini response (strip code fences if present)
    const jsonStr = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let words: { word: string; translation: string }[] = [];
    try {
      words = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Gemini response:", text);
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

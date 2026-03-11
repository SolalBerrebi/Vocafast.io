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

    const { text, nativeLang, targetLang, includeContext } = await request.json();

    if (!text || !targetLang || !nativeLang) {
      return NextResponse.json(
        { error: "Missing text, targetLang, or nativeLang" },
        { status: 400 },
      );
    }

    const targetName = getLangName(targetLang);
    const nativeName = getLangName(nativeLang);

    const prompt = `You are a vocabulary extraction assistant for language learners.

The user is learning ${targetName} and their native language is ${nativeName}.

Analyze the following text and extract useful vocabulary from it. The text may be:
- A list of words (one per line, comma-separated, etc.)
- A paragraph or passage in ${targetName} — extract the most useful words/expressions
- A mix of ${targetName} and ${nativeName} words — organize them into proper pairs
- Words in any language — always translate so "word" is in ${targetName} and "translation" is in ${nativeName}

LANGUAGE DETECTION — be smart about which field goes where:
- For EACH word/phrase in the input, detect its language automatically.
- Words in ${targetName} → put in "word" field, translate to ${nativeName} for "translation" field.
- Words in ${nativeName} → put in "translation" field, translate to ${targetName} for "word" field.
- Words in a third language → translate to both ${targetName} (for "word") and ${nativeName} (for "translation").
- Do NOT blindly assume the input language. Detect it per-item.

IMPORTANT RULES:
- Items can be single words OR multi-word expressions/phrases (e.g. "to get along", "faire la grasse matinée"). Extract natural expressions as-is.
- "word" MUST be in ${targetName} (the language being learned)
- "translation" MUST be in ${nativeName} (the user's native language)
- If the text contains verb conjugations or irregular forms, preserve them (e.g. "go / went / gone" stays as-is in the "word" field)
- Deduplicate entries
- Maximum 30 items

Return ONLY a valid JSON array with no other text, no markdown, no code fences. Each element must have "word" and "translation" fields${includeContext ? ', and a "context" field with a short example sentence in ' + targetName + ' using the word (under 15 words, natural and simple)' : ""}.
Example: [{"word":"שלום","translation":"hello"${includeContext ? ',"context":"שלום, מה שלומך היום?"' : ""}},{"word":"לקחת הפסקה","translation":"to take a break"${includeContext ? ',"context":"אני צריך לקחת הפסקה קצרה"' : ""}}]

If the text is empty or contains no extractable vocabulary, return an empty array: []

TEXT TO ANALYZE:
${text}`;

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
        temperature: 0.2,
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
        { error: `AI error: ${detail}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content ?? "";

    if (!responseText.trim()) {
      return NextResponse.json(
        { error: "No response from AI. Try different text." },
        { status: 422 },
      );
    }

    // Parse JSON from response (strip code fences if present)
    const jsonStr = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let words: { word: string; translation: string }[] = [];
    try {
      words = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Groq response:", responseText);
      return NextResponse.json(
        { error: "Could not parse vocabulary from text" },
        { status: 422 },
      );
    }

    // Filter valid entries
    const filtered = words.filter(
      (w) =>
        w.word &&
        w.translation &&
        w.word.length > 0 &&
        w.word.length < 200 &&
        w.translation.length > 0,
    );

    return NextResponse.json({ words: filtered });
  } catch (error) {
    console.error("Text extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract vocabulary" },
      { status: 500 },
    );
  }
}

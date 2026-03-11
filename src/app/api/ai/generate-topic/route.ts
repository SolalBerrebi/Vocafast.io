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

    const { topic, nativeLang, targetLang, existingWords, wordCount, level, includeContext } = await request.json();

    if (!topic || !targetLang || !nativeLang) {
      return NextResponse.json(
        { error: "Missing topic, targetLang, or nativeLang" },
        { status: 400 },
      );
    }

    const targetName = getLangName(targetLang);
    const nativeName = getLangName(nativeLang);

    // Clamp word count between 5 and 50, default 15
    const count = Math.min(50, Math.max(5, wordCount || 15));

    const excludeClause =
      existingWords && existingWords.length > 0
        ? `\n- Do NOT include any of these words (the user already has them): ${existingWords.join(", ")}`
        : "";

    // Map level to prompt instructions
    const levelDescriptions: Record<string, string> = {
      starter: "ABSOLUTE BEGINNER level — the very first words someone learns: greetings, numbers 1-10, yes/no, please/thank you, basic survival words. Think day 1 of language learning.",
      beginner: "BEGINNER level — common everyday words a tourist or early learner would need: basic food, colors, family members, simple verbs (go, eat, want), common adjectives (big, small, good).",
      intermediate: "INTERMEDIATE level — conversational vocabulary for someone who can hold basic conversations: more nuanced verbs, abstract concepts, workplace terms, opinions and feelings, compound expressions.",
      advanced: "ADVANCED level — sophisticated vocabulary for fluent conversations: formal/literary words, precise synonyms, technical terms, less common but useful expressions, phrasal verbs with nuance.",
      native: "NATIVE/IDIOMATIC level — slang, idioms, colloquial expressions, proverbs, cultural references, and words that only a native speaker would naturally use. Include informal/spoken language.",
    };
    const levelInstruction = level && levelDescriptions[level]
      ? `\nVOCABULARY LEVEL: ${levelDescriptions[level]}`
      : "";

    const contextInstruction = includeContext
      ? `\n\nEXAMPLE SENTENCES: For EACH word, also include a "context" field with a short, natural example sentence in ${targetName} that uses the word. The sentence should be simple enough for a learner at the specified level to understand. Keep sentences under 15 words.`
      : "";

    const contextExample = includeContext
      ? `Example: [{"word":"שלום","translation":"hello","context":"שלום, מה שלומך היום?"},{"word":"תודה","translation":"thank you","context":"תודה רבה על העזרה"}]`
      : `Example for irregular verbs in English with ${nativeName} translation: [{"word":"go / went / gone","translation":"aller"},{"word":"buy / bought / bought","translation":"acheter"}]
Example for regular vocabulary: [{"word":"שלום","translation":"hello"},{"word":"תודה","translation":"thank you"}]`;

    const prompt = `You are a vocabulary teacher. Generate exactly ${count} items for the user's request: "${topic}".${levelInstruction}

The "word" field must be in ${targetName}. The "translation" field must be in ${nativeName}.${contextInstruction}

CRITICAL — Interpret the user's request literally:
- If the user asks for "irregular verbs" in English, generate actual irregular verbs WITH their past tense and past participle forms in the "word" field. Example: "go / went / gone", "buy / bought / bought", "run / ran / run". The "translation" field should contain the ${nativeName} translation of the verb.
- If the user asks for "irregular verbs" in another language, show the relevant irregular conjugations for that language (e.g. French: "aller / je vais / j'allais").
- If the user asks for "animals", generate actual animal names — NOT words about biology.
- If the user asks for "emotions", generate actual emotion words (happy, sad, angry) — NOT psychology terms.
- In short: generate INSTANCES of the category, not META-VOCABULARY about the category.
- Items can be single words OR multi-word expressions/phrases when natural (e.g. "to get along", "ice cream", "traffic jam").

LANGUAGE DETECTION — be smart about which field goes where:
- Detect the language of each generated item. The "word" MUST be in ${targetName}, the "translation" MUST be in ${nativeName}.
- If ${targetName} and ${nativeName} share some words (e.g. cognates), use context to assign them correctly.

Additional rules:
- Choose practical, commonly-used items
- Items should be appropriate for a language learner (not too obscure)
- For regular verbs, use the infinitive form (e.g. "to go", "aller", "ללכת")
- For irregular verbs or conjugation topics, include the irregular/conjugated forms in the "word" field${excludeClause}

Return ONLY a valid JSON array with no other text, no markdown, no code fences.
Each element must have "word" (in ${targetName}) and "translation" (in ${nativeName}) fields${includeContext ? ', and a "context" field with an example sentence' : ""}.

${contextExample}`;

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
        max_tokens: count > 20 ? 4096 : 2048,
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

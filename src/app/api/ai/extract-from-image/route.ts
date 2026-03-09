import { NextRequest, NextResponse } from "next/server";

// This route receives OCR text extracted client-side by Tesseract.js
// and translates the extracted word-translation pairs using LibreTranslate.

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

interface ParsedPair {
  word: string;
  translation: string;
}

function parseOCRText(text: string): ParsedPair[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const pairs: ParsedPair[] = [];

  for (const line of lines) {
    // Try common table/list separators: tab, |, -, :, =, multiple spaces
    const separators = ["\t", " | ", " - ", " : ", " = ", "  "];
    let found = false;

    for (const sep of separators) {
      if (line.includes(sep)) {
        const parts = line.split(sep).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          pairs.push({ word: parts[0], translation: parts[1] });
          found = true;
          break;
        }
      }
    }

    // If no separator found, treat as a standalone word (will need translation)
    if (!found && line.trim().length > 0 && line.trim().length < 100) {
      pairs.push({ word: line.trim(), translation: "" });
    }
  }

  return pairs;
}

export async function POST(request: NextRequest) {
  try {
    const { ocrText, targetLang, nativeLang } = await request.json();

    if (!ocrText || !targetLang || !nativeLang) {
      return NextResponse.json(
        { error: "Missing ocrText, targetLang, or nativeLang" },
        { status: 400 },
      );
    }

    const parsed = parseOCRText(ocrText);

    // Translate words that don't have translations yet
    const words = await Promise.all(
      parsed.map(async (pair) => {
        if (pair.translation) {
          return pair;
        }
        try {
          const translation = await translate(pair.word, targetLang, nativeLang);
          return { word: pair.word, translation };
        } catch {
          return { word: pair.word, translation: "?" };
        }
      }),
    );

    // Filter out garbage entries
    const filtered = words.filter(
      (w) => w.word.length > 0 && w.word.length < 80,
    );

    return NextResponse.json({ words: filtered });
  } catch (error) {
    console.error("Image extraction error:", error);
    return NextResponse.json(
      { error: "Failed to process image text" },
      { status: 500 },
    );
  }
}

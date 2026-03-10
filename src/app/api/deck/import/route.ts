import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

interface ImportedWord {
  word: string;
  translation: string;
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const environmentId = formData.get("environmentId") as string | null;
    const deckName = formData.get("deckName") as string | null;

    if (!file || !environmentId) {
      return NextResponse.json(
        { error: "Missing file or environmentId" },
        { status: 400 },
      );
    }

    // Verify environment belongs to user (RLS handles this)
    const { data: env } = await supabase
      .from("language_environments")
      .select("id")
      .eq("id", environmentId)
      .single();

    if (!env) {
      return NextResponse.json({ error: "Environment not found" }, { status: 404 });
    }

    const fileName = file.name.toLowerCase();
    const fileText = await file.text();
    let words: ImportedWord[] = [];
    let resolvedDeckName = deckName || file.name.replace(/\.[^.]+$/, "");

    if (fileName.endsWith(".vocafast.json") || fileName.endsWith(".json")) {
      // Vocafast native JSON format
      const parsed = parseVocafastJson(fileText);
      words = parsed.words;
      if (parsed.deckName && !deckName) resolvedDeckName = parsed.deckName;
    } else if (fileName.endsWith(".apkg")) {
      // Anki packages are zip files containing SQLite — we can't parse binary in edge
      // Instead, we support Anki text export format (.txt)
      return NextResponse.json(
        { error: "Anki .apkg files are not supported directly. Please export from Anki as \"Notes in Plain Text\" (.txt) and import that file instead." },
        { status: 422 },
      );
    } else {
      // CSV, TSV, or plain text
      words = parseCsvTsv(fileText);
    }

    if (words.length === 0) {
      return NextResponse.json(
        { error: "No valid word pairs found in file. Expected format: word and translation separated by tab, comma, or semicolon (one pair per line)." },
        { status: 422 },
      );
    }

    // Cap at 500 words per import
    const cappedWords = words.slice(0, 500);

    // Create deck
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({
        environment_id: environmentId,
        name: resolvedDeckName,
        icon: "📥",
        color: "#5856D6",
      })
      .select("id")
      .single();

    if (deckError || !deck) {
      return NextResponse.json(
        { error: "Failed to create deck" },
        { status: 500 },
      );
    }

    // Insert words in batches of 100
    let insertedCount = 0;
    for (let i = 0; i < cappedWords.length; i += 100) {
      const batch = cappedWords.slice(i, i + 100).map((w) => ({
        deck_id: deck.id,
        word: w.word,
        translation: w.translation,
        context_sentence: w.context || null,
        source_type: "manual" as const,
      }));

      const { error } = await supabase.from("words").insert(batch);
      if (!error) insertedCount += batch.length;
    }

    return NextResponse.json({
      deckId: deck.id,
      deckName: resolvedDeckName,
      wordCount: insertedCount,
      totalInFile: words.length,
      capped: words.length > 500,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import file" }, { status: 500 });
  }
}

function parseVocafastJson(text: string): { words: ImportedWord[]; deckName?: string } {
  try {
    const data = JSON.parse(text);

    // Vocafast native format
    if (data.format === "vocafast-v1" && Array.isArray(data.words)) {
      return {
        words: data.words
          .filter((w: { word?: string; translation?: string }) => w.word && w.translation)
          .map((w: { word: string; translation: string; context?: string }) => ({
            word: w.word,
            translation: w.translation,
            context: w.context || "",
          })),
        deckName: data.deck?.name,
      };
    }

    // Plain JSON array of {word, translation}
    if (Array.isArray(data)) {
      return {
        words: data
          .filter((w: { word?: string; translation?: string }) => w.word && w.translation)
          .map((w: { word: string; translation: string }) => ({
            word: w.word,
            translation: w.translation,
          })),
      };
    }

    return { words: [] };
  } catch {
    return { words: [] };
  }
}

function parseCsvTsv(text: string): ImportedWord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detect separator: tab, semicolon, or comma
  const firstLine = lines[0];
  let separator = "\t";
  if (!firstLine.includes("\t")) {
    if (firstLine.includes(";")) separator = ";";
    else if (firstLine.includes(",")) separator = ",";
  }

  const words: ImportedWord[] = [];

  for (const line of lines) {
    const parts = line.split(separator).map((p) => p.trim().replace(/^["']|["']$/g, ""));

    // Skip header rows
    if (words.length === 0 && isHeaderRow(parts)) continue;

    if (parts.length >= 2 && parts[0] && parts[1]) {
      words.push({
        word: parts[0],
        translation: parts[1],
        context: parts[2] || "",
      });
    }
  }

  return words;
}

function isHeaderRow(parts: string[]): boolean {
  const headers = ["word", "translation", "front", "back", "term", "definition", "question", "answer", "context"];
  return parts.some((p) => headers.includes(p.toLowerCase()));
}

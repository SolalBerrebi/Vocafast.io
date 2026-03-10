import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const deckId = request.nextUrl.searchParams.get("deckId");
    const format = request.nextUrl.searchParams.get("format") ?? "csv";

    if (!deckId) {
      return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
    }

    // Fetch deck with ownership check via RLS
    const { data: deck } = await supabase
      .from("decks")
      .select("name, icon, color, environment_id")
      .eq("id", deckId)
      .single();

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Fetch target language
    const { data: env } = await supabase
      .from("language_environments")
      .select("target_lang")
      .eq("id", deck.environment_id)
      .single();

    // Fetch all words
    const { data: words } = await supabase
      .from("words")
      .select("word, translation, context_sentence, source_type")
      .eq("deck_id", deckId)
      .order("created_at");

    if (!words || words.length === 0) {
      return NextResponse.json({ error: "Deck has no words to export" }, { status: 422 });
    }

    if (format === "json") {
      // Vocafast native format
      const exportData = {
        format: "vocafast-v1",
        deck: {
          name: deck.name,
          icon: deck.icon,
          color: deck.color,
          target_lang: env?.target_lang ?? "",
        },
        words: words.map((w) => ({
          word: w.word,
          translation: w.translation,
          context: w.context_sentence ?? "",
        })),
        exported_at: new Date().toISOString(),
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${sanitizeFilename(deck.name)}.vocafast.json"`,
        },
      });
    }

    // CSV format (compatible with Anki and most apps)
    const csvRows = [
      "word\ttranslation\tcontext",
      ...words.map(
        (w) =>
          `${escapeTsv(w.word)}\t${escapeTsv(w.translation)}\t${escapeTsv(w.context_sentence ?? "")}`,
      ),
    ];

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(deck.name)}.tsv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export deck" }, { status: 500 });
  }
}

function escapeTsv(value: string): string {
  return value.replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, "");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF\u00C0-\u024F _-]/g, "").trim() || "deck";
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBackLink,
  Block,
  List,
  Button,
  Preloader,
  Searchbar,
} from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import type { Deck, Word } from "@/types/database";
import WordRow from "@/components/deck/WordRow";

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [deckRes, wordsRes] = await Promise.all([
      supabase.from("decks").select("*").eq("id", deckId).single(),
      supabase
        .from("words")
        .select("*")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: false }),
    ]);
    setDeck(deckRes.data as Deck | null);
    setWords((wordsRes.data as Word[]) ?? []);
    setLoading(false);
  }, [deckId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (wordId: string) => {
    await supabase.from("words").delete().eq("id", wordId);
    setWords((w) => w.filter((word) => word.id !== wordId));
  };

  const filtered = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <>
        <Navbar
          title="Loading..."
          left={<NavbarBackLink onClick={() => router.back()} />}
        />
        <Block className="text-center mt-16">
          <Preloader />
        </Block>
      </>
    );
  }

  if (!deck) {
    return (
      <>
        <Navbar
          title="Not Found"
          left={<NavbarBackLink onClick={() => router.back()} />}
        />
        <Block className="text-center mt-16">
          <p>Deck not found</p>
        </Block>
      </>
    );
  }

  return (
    <>
      <Navbar
        title={deck.name}
        left={<NavbarBackLink onClick={() => router.back()} />}
      />

      <Block className="flex gap-2">
        <Button
          small
          className="flex-1"
          onClick={() => router.push(`/decks/${deckId}/add`)}
        >
          Add Words
        </Button>
        <Button
          small
          className="flex-1"
          outline
          onClick={() => router.push(`/decks/${deckId}/train`)}
          disabled={words.length === 0}
        >
          Train
        </Button>
      </Block>

      {words.length > 5 && (
        <Searchbar
          value={search}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          onClear={() => setSearch("")}
        />
      )}

      {words.length === 0 ? (
        <Block className="text-center mt-8">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="font-semibold">No words yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Add words to start building your vocabulary
          </p>
        </Block>
      ) : (
        <List strongIos insetIos>
          {filtered.map((word) => (
            <WordRow
              key={word.id}
              word={word}
              onDelete={() => handleDelete(word.id)}
            />
          ))}
        </List>
      )}
    </>
  );
}

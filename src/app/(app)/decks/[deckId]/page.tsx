"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBackLink,
  Block,
  List,
  ListInput,
  Button,
  Preloader,
  Searchbar,
  Sheet,
  BlockTitle,
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

  // Edit sheet state
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [editWordValue, setEditWordValue] = useState("");
  const [editTranslationValue, setEditTranslationValue] = useState("");
  const [editContextValue, setEditContextValue] = useState("");
  const [saving, setSaving] = useState(false);

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
    setEditWord(null);
  };

  const openEdit = (word: Word) => {
    setEditWord(word);
    setEditWordValue(word.word);
    setEditTranslationValue(word.translation);
    setEditContextValue(word.context_sentence ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editWord || !editWordValue.trim() || !editTranslationValue.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("words")
      .update({
        word: editWordValue.trim(),
        translation: editTranslationValue.trim(),
        context_sentence: editContextValue.trim() || null,
      })
      .eq("id", editWord.id)
      .select()
      .single();

    if (data) {
      setWords((prev) =>
        prev.map((w) => (w.id === editWord.id ? (data as Word) : w)),
      );
    }
    setSaving(false);
    setEditWord(null);
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
              onClick={() => openEdit(word)}
              onDelete={() => handleDelete(word.id)}
            />
          ))}
        </List>
      )}

      {/* Edit Word Sheet */}
      <Sheet
        opened={!!editWord}
        onBackdropClick={() => setEditWord(null)}
        className="pb-safe"
      >
        <BlockTitle>Edit Word</BlockTitle>
        <List strongIos insetIos>
          <ListInput
            type="text"
            label="Word"
            value={editWordValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditWordValue(e.target.value)
            }
          />
          <ListInput
            type="text"
            label="Translation"
            value={editTranslationValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditTranslationValue(e.target.value)
            }
          />
          <ListInput
            type="text"
            label="Context sentence (optional)"
            value={editContextValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditContextValue(e.target.value)
            }
          />
        </List>
        <Block className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSaveEdit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            className="flex-1"
            outline
            onClick={() => editWord && handleDelete(editWord.id)}
          >
            <span className="text-red-500">Delete</span>
          </Button>
        </Block>
      </Sheet>
    </>
  );
}

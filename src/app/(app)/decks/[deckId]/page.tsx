"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Preloader,
  Sheet,
  BlockTitle,
  List,
  ListInput,
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
      <div className="px-5 pt-2 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex justify-center mt-16">
          <Preloader />
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="px-5 pt-2 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-center mt-16">
          <p className="text-gray-500">Deck not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-2 pb-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Deck header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: deck.color + "15" }}
          >
            {deck.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{deck.name}</h1>
            <p className="text-[13px] text-gray-400">{words.length} {words.length === 1 ? "word" : "words"}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 mb-5">
          <button
            onClick={() => router.push(`/decks/${deckId}/add`)}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold text-[14px] active:scale-[0.98] transition-all"
          >
            Add Words
          </button>
          <button
            onClick={() => router.push(`/decks/${deckId}/train`)}
            disabled={words.length === 0}
            className="flex-1 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-[14px] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            Train
          </button>
        </div>

        {/* Search */}
        {words.length > 5 && (
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search words..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Word list */}
        {words.length === 0 ? (
          <div className="text-center mt-10">
            <div className="text-5xl mb-3">📝</div>
            <h3 className="font-semibold tracking-tight">No words yet</h3>
            <p className="text-gray-400 text-[14px] mt-1">
              Add words to start building your vocabulary
            </p>
          </div>
        ) : (
          <List strongIos insetIos className="-mx-5">
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
      </div>

      {/* Edit Word Sheet */}
      <Sheet
        opened={!!editWord}
        onBackdropClick={() => setEditWord(null)}
        className="pb-safe"
      >
        <div className="px-5 pt-4 pb-2 flex justify-between items-center">
          <button
            className="text-blue-500 text-[15px] font-medium"
            onClick={() => setEditWord(null)}
          >
            Cancel
          </button>
          <span className="font-semibold text-[16px]">Edit Word</span>
          <button
            className={`text-[15px] font-semibold ${
              editWordValue.trim() && editTranslationValue.trim()
                ? "text-blue-500"
                : "text-gray-300"
            }`}
            onClick={handleSaveEdit}
            disabled={saving || !editWordValue.trim() || !editTranslationValue.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <div className="px-5 py-3 space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Word</label>
            <input
              type="text"
              value={editWordValue}
              onChange={(e) => setEditWordValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[16px] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Translation</label>
            <input
              type="text"
              value={editTranslationValue}
              onChange={(e) => setEditTranslationValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[16px] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Context (optional)</label>
            <input
              type="text"
              value={editContextValue}
              onChange={(e) => setEditContextValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[16px] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>
        </div>
        <div className="px-5 pb-4">
          <button
            onClick={() => editWord && handleDelete(editWord.id)}
            className="w-full py-3 rounded-xl text-red-500 font-medium text-[15px] bg-red-50 active:scale-[0.98] transition-all"
          >
            Delete Word
          </button>
        </div>
      </Sheet>
    </>
  );
}

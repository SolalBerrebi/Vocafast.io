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
      <div className="px-5 pt-2 pb-24">
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

        {/* Add words button */}
        <button
          onClick={() => router.push(`/decks/${deckId}/add`)}
          className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-[14px] active:scale-[0.98] transition-transform mb-5"
        >
          + Add Words
        </button>

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
          <div className="mt-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="text-lg font-bold tracking-tight">Your deck is empty</h3>
              <p className="text-gray-400 text-[14px] mt-1">
                Add vocabulary using any of these methods
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { icon: "✏️", title: "Manual Entry", desc: "Type words and translations one by one", color: "blue" },
                { icon: "📷", title: "Photo Scan", desc: "Snap a photo of a textbook or menu — AI reads it", color: "purple" },
                { icon: "📋", title: "Paste Text", desc: "Paste any text — AI extracts vocabulary for you", color: "green" },
                { icon: "🤖", title: "AI Topics", desc: "Pick a topic and AI generates words instantly", color: "orange" },
              ].map((method) => (
                <button
                  key={method.title}
                  onClick={() => router.push(`/decks/${deckId}/add`)}
                  className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 text-left active:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-gray-800">{method.title}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{method.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
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

      {/* Sticky Train button at bottom */}
      {words.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-white via-white to-white/0 z-10">
          <button
            onClick={() => router.push(`/decks/${deckId}/train`)}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-[16px] active:scale-[0.98] transition-transform shadow-lg shadow-green-500/25 flex items-center justify-center gap-2.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Start Training
          </button>
        </div>
      )}

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

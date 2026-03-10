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
import { useEnvironmentStore } from "@/stores/environment-store";
import type { Deck, Word } from "@/types/database";
import WordRow from "@/components/deck/WordRow";

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
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

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [deckRes, wordsRes] = await Promise.all([
      supabase.from("decks").select("*").eq("id", deckId).single(),
      supabase
        .from("words")
        .select("*")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: false }),
    ]);

    const deckData = deckRes.data as Deck | null;

    // Validate deck belongs to active environment
    if (deckData && activeEnvironmentId && deckData.environment_id !== activeEnvironmentId) {
      router.replace("/decks");
      return;
    }

    setDeck(deckData);
    setWords((wordsRes.data as Word[]) ?? []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, activeEnvironmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (wordId: string) => {
    await supabase.from("words").delete().eq("id", wordId);
    setWords((w) => w.filter((word) => word.id !== wordId));
    setEditWord(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    await supabase.from("words").delete().in("id", ids);
    setWords((w) => w.filter((word) => !selectedIds.has(word.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    setBulkDeleting(false);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
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
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{deck.name}</h1>
            <p className="text-[13px] text-gray-400">{words.length} {words.length === 1 ? "word" : "words"}</p>
          </div>
          {words.length > 0 && (
            <div className="flex gap-1">
              {selectMode ? (
                <button
                  onClick={exitSelectMode}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-500 font-semibold text-[13px]"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
                    title="Select words"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/deck/export?deckId=${deckId}&format=csv`);
                        if (!res.ok) return;
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${deck.name}.tsv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {}
                    }}
                    className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
                    title="Export as TSV"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/deck/export?deckId=${deckId}&format=json`);
                        if (!res.ok) return;
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${deck.name}.vocafast.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {}
                    }}
                    className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
                    title="Export as Vocafast JSON"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Add words button (hidden in select mode) */}
        {!selectMode && (
          <button
            onClick={() => router.push(`/decks/${deckId}/add`)}
            className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-[14px] active:scale-[0.98] transition-transform mb-5"
          >
            + Add Words
          </button>
        )}

        {/* Select all bar */}
        {selectMode && words.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() => {
                if (selectedIds.size === filtered.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(filtered.map((w) => w.id)));
                }
              }}
              className="flex items-center gap-2 text-blue-500 font-medium text-[14px]"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                selectedIds.size === filtered.length && filtered.length > 0
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-300"
              }`}>
                {selectedIds.size === filtered.length && filtered.length > 0 && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <span className="text-[13px] text-gray-400">
              {selectedIds.size} selected
            </span>
          </div>
        )}

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
        ) : selectMode ? (
          <div className="space-y-1">
            {filtered.map((word) => {
              const isSelected = selectedIds.has(word.id);
              return (
                <button
                  key={word.id}
                  onClick={() => toggleSelect(word.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    isSelected ? "bg-red-50 border border-red-200" : "bg-white border border-gray-100"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-red-500 border-red-500" : "border-gray-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-gray-800 truncate">{word.word}</p>
                    <p className="text-[13px] text-gray-400 truncate">{word.translation}</p>
                  </div>
                </button>
              );
            })}
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

      {/* Sticky bottom button */}
      {words.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-white via-white to-white/0 z-10">
          {selectMode ? (
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || bulkDeleting}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[16px] active:scale-[0.98] transition-transform shadow-lg shadow-red-500/25 flex items-center justify-center gap-2.5 disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Word${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/decks/${deckId}/train`)}
              className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-[16px] active:scale-[0.98] transition-transform shadow-lg shadow-green-500/25 flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              Start Training
            </button>
          )}
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

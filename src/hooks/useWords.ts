"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Word, WordSourceType } from "@/types/database";

export function useWords(deckId: string) {
  const supabase = createClient();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWords = useCallback(async () => {
    const { data } = await supabase
      .from("words")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false });
    setWords((data as Word[]) ?? []);
    setLoading(false);
  }, [deckId, supabase]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const addWord = async (
    word: string,
    translation: string,
    sourceType: WordSourceType = "manual",
  ) => {
    const { data, error } = await supabase
      .from("words")
      .insert({
        deck_id: deckId,
        word,
        translation,
        source_type: sourceType,
      })
      .select()
      .single();
    if (data) setWords((prev) => [data as Word, ...prev]);
    return { data, error };
  };

  const addWords = async (
    entries: { word: string; translation: string }[],
    sourceType: WordSourceType,
  ) => {
    const { data, error } = await supabase
      .from("words")
      .insert(
        entries.map((e) => ({
          deck_id: deckId,
          word: e.word,
          translation: e.translation,
          source_type: sourceType,
        })),
      )
      .select();
    if (data) setWords((prev) => [...(data as Word[]), ...prev]);
    return { data, error };
  };

  const deleteWord = async (id: string) => {
    const { error } = await supabase.from("words").delete().eq("id", id);
    if (!error) setWords((prev) => prev.filter((w) => w.id !== id));
    return { error };
  };

  const updateWord = async (
    id: string,
    updates: { word?: string; translation?: string },
  ) => {
    const { data, error } = await supabase
      .from("words")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (data) {
      setWords((prev) =>
        prev.map((w) => (w.id === id ? (data as Word) : w)),
      );
    }
    return { data, error };
  };

  return { words, loading, addWord, addWords, deleteWord, updateWord, fetchWords };
}

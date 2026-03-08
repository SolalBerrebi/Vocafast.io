"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import type { Deck } from "@/types/database";

export function useDeck(deckId?: string) {
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDecks = useCallback(async () => {
    if (!activeEnvironmentId) return;
    const { data } = await supabase
      .from("decks")
      .select("*")
      .eq("environment_id", activeEnvironmentId)
      .order("created_at", { ascending: false });
    setDecks((data as Deck[]) ?? []);
    setLoading(false);
  }, [activeEnvironmentId, supabase]);

  const fetchDeck = useCallback(async () => {
    if (!deckId) return;
    const { data } = await supabase
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .single();
    setDeck(data as Deck | null);
    setLoading(false);
  }, [deckId, supabase]);

  useEffect(() => {
    if (deckId) fetchDeck();
    else fetchDecks();
  }, [deckId, fetchDeck, fetchDecks]);

  const createDeck = async (name: string, color: string, icon: string) => {
    if (!activeEnvironmentId) return null;
    const { data, error } = await supabase
      .from("decks")
      .insert({
        environment_id: activeEnvironmentId,
        name,
        color,
        icon,
      })
      .select()
      .single();
    if (data) setDecks((prev) => [data as Deck, ...prev]);
    return { data, error };
  };

  const deleteDeck = async (id: string) => {
    const { error } = await supabase.from("decks").delete().eq("id", id);
    if (!error) setDecks((prev) => prev.filter((d) => d.id !== id));
    return { error };
  };

  return { decks, deck, loading, createDeck, deleteDeck, fetchDecks };
}

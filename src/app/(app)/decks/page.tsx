"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  Block,
  Fab,
  Preloader,
} from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import type { Deck } from "@/types/database";
import DeckCard from "@/components/deck/DeckCard";

export default function DecksPage() {
  const router = useRouter();
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeEnvironmentId) {
      setLoading(false);
      return;
    }

    const fetchDecks = async () => {
      const { data } = await supabase
        .from("decks")
        .select("*")
        .eq("environment_id", activeEnvironmentId)
        .order("created_at", { ascending: false });
      setDecks((data as Deck[]) ?? []);
      setLoading(false);
    };

    fetchDecks();
  }, [activeEnvironmentId, supabase]);

  return (
    <>
      <Navbar title="My Decks" />

      {loading ? (
        <Block className="text-center mt-16">
          <Preloader />
        </Block>
      ) : decks.length === 0 ? (
        <Block className="text-center mt-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold">No decks yet</h2>
          <p className="text-gray-500 mt-2">
            Create your first vocabulary deck to start learning
          </p>
        </Block>
      ) : (
        <Block>
          <div className="space-y-3">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onClick={() => router.push(`/decks/${deck.id}`)}
              />
            ))}
          </div>
        </Block>
      )}

      <Fab
        className="fixed right-4 bottom-24 z-40"
        onClick={() => router.push("/decks/new")}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        }
      />
    </>
  );
}

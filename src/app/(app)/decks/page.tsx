"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Preloader } from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import type { Deck } from "@/types/database";
import DeckCard from "@/components/deck/DeckCard";
import CoachMark from "@/components/ui/CoachMark";

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

    // Reset on environment change to avoid showing stale decks
    setLoading(true);
    setDecks([]);

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
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-5">My Decks</h1>

      {loading ? (
        <div className="flex justify-center mt-20">
          <Preloader />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold tracking-tight">No decks yet</h2>
          <p className="text-gray-400 mt-2 text-[15px]">
            Create your first vocabulary deck to start learning
          </p>
        </div>
      ) : (
        <>
          <CoachMark id="decks-tap-deck" className="mb-4">
            <p className="font-semibold text-[15px] mb-1">Tap your deck to get started!</p>
            <p className="text-[13px] text-blue-100 leading-relaxed">
              Open a deck to add vocabulary and start training. Use the + button to create more decks.
            </p>
          </CoachMark>

          <div className="space-y-2.5">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onClick={() => router.push(`/decks/${deck.id}`)}
              />
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => router.push("/decks/new")}
        className="fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-all"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}

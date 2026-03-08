"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBackLink,
  Block,
  Button,
  Preloader,
  List,
  ListItem,
  Radio,
} from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import { useTrainingStore } from "@/stores/training-store";
import { buildTrainingQueue } from "@/lib/srs/scheduler";
import type { Deck, TrainingMode, Word } from "@/types/database";

export default function TrainLauncherPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const startSession = useTrainingStore((s) => s.startSession);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [mode, setMode] = useState<TrainingMode>("flashcard");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: deckData } = await supabase
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .single();
    setDeck(deckData as Deck | null);

    const words = await buildTrainingQueue(deckId);
    setAvailableWords(words);
    setLoading(false);
  }, [deckId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStart = async () => {
    if (!activeEnvironmentId || availableWords.length === 0) return;
    setStarting(true);

    // Create session in DB
    const { data: session } = await supabase
      .from("training_sessions")
      .insert({
        environment_id: activeEnvironmentId,
        deck_id: deckId,
        mode,
      })
      .select()
      .single();

    if (!session) {
      setStarting(false);
      return;
    }

    // Build cards with options for multiple choice
    const cards = availableWords.map((word) => {
      if (mode === "multiple_choice") {
        const others = availableWords
          .filter((w) => w.id !== word.id)
          .map((w) => w.translation);
        // Shuffle and take 3 distractors
        const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...shuffled, word.translation].sort(
          () => Math.random() - 0.5,
        );
        return { word, options };
      }
      return { word };
    });

    startSession({ sessionId: session.id, mode, cards });
    router.push(`/train/${session.id}`);
  };

  if (loading) {
    return (
      <>
        <Navbar
          title="Train"
          left={<NavbarBackLink onClick={() => router.back()} />}
        />
        <Block className="text-center mt-16">
          <Preloader />
        </Block>
      </>
    );
  }

  return (
    <>
      <Navbar
        title={deck?.name ?? "Train"}
        left={<NavbarBackLink onClick={() => router.back()} />}
      />

      <Block className="text-center mt-4">
        <div className="text-5xl mb-3">🧠</div>
        <h2 className="text-xl font-bold">
          {availableWords.length} words to review
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Choose your training mode
        </p>
      </Block>

      <List strongIos insetIos>
        <ListItem
          title="Flashcards"
          subtitle="Flip to reveal translation"
          media={<span className="text-xl">🃏</span>}
          after={
            <Radio
              checked={mode === "flashcard"}
              onChange={() => setMode("flashcard")}
            />
          }
          onClick={() => setMode("flashcard")}
        />
        <ListItem
          title="Multiple Choice"
          subtitle="Pick the correct translation"
          media={<span className="text-xl">📝</span>}
          after={
            <Radio
              checked={mode === "multiple_choice"}
              onChange={() => setMode("multiple_choice")}
            />
          }
          onClick={() => setMode("multiple_choice")}
        />
        <ListItem
          title="Typing"
          subtitle="Type the translation"
          media={<span className="text-xl">⌨️</span>}
          after={
            <Radio
              checked={mode === "typing"}
              onChange={() => setMode("typing")}
            />
          }
          onClick={() => setMode("typing")}
        />
      </List>

      <Block>
        <Button
          large
          onClick={handleStart}
          disabled={availableWords.length === 0 || starting}
        >
          {starting ? "Starting..." : "Start Training"}
        </Button>
      </Block>
    </>
  );
}

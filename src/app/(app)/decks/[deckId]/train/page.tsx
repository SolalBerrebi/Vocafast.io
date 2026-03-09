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
  BlockTitle,
  Segmented,
  SegmentedButton,
} from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import { useTrainingStore } from "@/stores/training-store";
import { buildTrainingQueue, getDeckStats } from "@/lib/srs/scheduler";
import type { StudyScope } from "@/lib/srs/scheduler";
import type { Deck, TrainingMode, Word } from "@/types/database";

const SESSION_SIZES = [5, 10, 15, 20];

export default function TrainLauncherPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const startSession = useTrainingStore((s) => s.startSession);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState({ total: 0, due: 0, newCount: 0, learning: 0, mastered: 0 });
  const [mode, setMode] = useState<TrainingMode>("flashcard");
  const [scope, setScope] = useState<StudyScope>("smart");
  const [sessionSize, setSessionSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchData = useCallback(async () => {
    const [deckRes, deckStats] = await Promise.all([
      supabase.from("decks").select("*").eq("id", deckId).single(),
      getDeckStats(deckId),
    ]);
    setDeck(deckRes.data as Deck | null);
    setStats(deckStats);
    setLoading(false);
  }, [deckId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-select best scope
  useEffect(() => {
    if (stats.due > 0 || stats.newCount > 0) {
      setScope("smart");
    } else if (stats.total > 0) {
      setScope("all");
    }
  }, [stats]);

  const scopeDescription = () => {
    switch (scope) {
      case "smart":
        return `${stats.due} due + ${stats.newCount} new words`;
      case "all":
        return `Practice any of your ${stats.total} words`;
      case "mistakes":
        return "Words you've struggled with";
      case "new_only":
        return `${stats.newCount} words not yet studied`;
    }
  };

  const handleStart = async () => {
    if (!activeEnvironmentId || stats.total === 0) return;
    setStarting(true);

    const availableWords = await buildTrainingQueue(deckId, scope, sessionSize);

    if (availableWords.length === 0) {
      setStarting(false);
      return;
    }

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
    const cards = availableWords.map((word: Word) => {
      if (mode === "multiple_choice") {
        const others = availableWords
          .filter((w: Word) => w.id !== word.id)
          .map((w: Word) => w.translation);
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

      {/* Deck stats */}
      <Block>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-blue-50 rounded-2xl p-3">
            <p className="text-xl font-bold text-blue-600">{stats.due}</p>
            <p className="text-[10px] text-blue-400 font-medium">Due</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-3">
            <p className="text-xl font-bold text-purple-600">{stats.newCount}</p>
            <p className="text-[10px] text-purple-400 font-medium">New</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-3">
            <p className="text-xl font-bold text-orange-600">{stats.learning}</p>
            <p className="text-[10px] text-orange-400 font-medium">Learning</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-3">
            <p className="text-xl font-bold text-green-600">{stats.mastered}</p>
            <p className="text-[10px] text-green-400 font-medium">Mastered</p>
          </div>
        </div>
      </Block>

      {/* Study scope */}
      <BlockTitle>What to study</BlockTitle>
      <List strongIos insetIos>
        <ListItem
          title="Smart Review"
          subtitle="Due words + new words (SRS)"
          media={<span className="text-lg">🧠</span>}
          after={
            <Radio
              checked={scope === "smart"}
              onChange={() => setScope("smart")}
            />
          }
          onClick={() => setScope("smart")}
        />
        <ListItem
          title="All Words"
          subtitle="Practice everything in this deck"
          media={<span className="text-lg">📚</span>}
          after={
            <Radio
              checked={scope === "all"}
              onChange={() => setScope("all")}
            />
          }
          onClick={() => setScope("all")}
        />
        <ListItem
          title="Difficult Words"
          subtitle="Words you've struggled with"
          media={<span className="text-lg">💪</span>}
          after={
            <Radio
              checked={scope === "mistakes"}
              onChange={() => setScope("mistakes")}
            />
          }
          onClick={() => setScope("mistakes")}
        />
        <ListItem
          title="New Only"
          subtitle="Only unreviewed words"
          media={<span className="text-lg">✨</span>}
          after={
            <Radio
              checked={scope === "new_only"}
              onChange={() => setScope("new_only")}
            />
          }
          onClick={() => setScope("new_only")}
        />
      </List>

      {/* Training mode */}
      <BlockTitle>How to study</BlockTitle>
      <List strongIos insetIos>
        <ListItem
          title="Flashcards"
          subtitle="Flip to reveal translation"
          media={<span className="text-lg">🃏</span>}
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
          media={<span className="text-lg">📝</span>}
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
          media={<span className="text-lg">⌨️</span>}
          after={
            <Radio
              checked={mode === "typing"}
              onChange={() => setMode("typing")}
            />
          }
          onClick={() => setMode("typing")}
        />
      </List>

      {/* Session size */}
      <BlockTitle>Session size</BlockTitle>
      <Block>
        <Segmented strong>
          {SESSION_SIZES.map((size) => (
            <SegmentedButton
              key={size}
              active={sessionSize === size}
              onClick={() => setSessionSize(size)}
            >
              {size}
            </SegmentedButton>
          ))}
        </Segmented>
      </Block>

      {/* Start */}
      <Block>
        <p className="text-center text-sm text-gray-400 mb-3">
          {scopeDescription()}
        </p>
        <Button
          large
          onClick={handleStart}
          disabled={stats.total === 0 || starting}
        >
          {starting ? "Starting..." : "Start Training"}
        </Button>
      </Block>
    </>
  );
}

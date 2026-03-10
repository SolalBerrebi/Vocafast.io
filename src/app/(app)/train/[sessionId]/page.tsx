"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Page } from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useTrainingStore } from "@/stores/training-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { useGamification } from "@/hooks/useGamification";
import { calculateSRS } from "@/lib/srs/engine";
import { calculateSessionXP } from "@/lib/gamification/xp-engine";
import { getLevelForXP, getNextLevel } from "@/lib/gamification/levels";
import FlashCard from "@/components/training/FlashCard";
import type { AnswerQuality } from "@/components/training/FlashCard";
import MultipleChoice from "@/components/training/MultipleChoice";
import TypingChallenge from "@/components/training/TypingChallenge";
import SessionSummary from "@/components/training/SessionSummary";

// Map UI quality to SM-2 quality rating
const QUALITY_MAP: Record<AnswerQuality, number> = {
  again: 1, // Incorrect
  hard: 3, // Correct with difficulty
  good: 5, // Perfect
};

function TrainingTimer({ startedAt }: { startedAt: number | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    setElapsed(Date.now() - startedAt);
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const min = Math.floor(elapsed / 60000);
  const sec = Math.floor((elapsed % 60000) / 1000);
  return (
    <span className="text-[13px] text-gray-400 font-medium tabular-nums">
      {min}:{sec.toString().padStart(2, "0")}
    </span>
  );
}

export default function TrainingSessionPage() {
  const router = useRouter();
  const supabase = createClient();
  const { awardXP, streakDays } = useGamification();
  const showTimer = useGamificationStore((s) => s.showTimer);
  const setShowTimer = useGamificationStore((s) => s.setShowTimer);

  const {
    sessionId,
    mode,
    frontSide,
    cards,
    currentIndex,
    correct,
    hard,
    incorrect,
    startedAt,
    isFinished,
    responseTimes,
    answerCorrect,
    answerHard,
    answerIncorrect,
    nextCard,
    resetSession,
  } = useTrainingStore();

  // XP calculation — only compute once when session finishes
  const [xpResult, setXpResult] = useState<{
    totalXP: number;
    baseXP: number;
    speedBonus: number;
    streakMultiplier: number;
    completionBonus: number;
  } | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevelEmoji, setNewLevelEmoji] = useState<string | null>(null);
  const [newLevelName, setNewLevelName] = useState<string | null>(null);
  const xpAwarded = useRef(false);

  useEffect(() => {
    if (!isFinished || xpAwarded.current) return;
    xpAwarded.current = true;

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const result = calculateSessionXP({
      correct,
      hard,
      incorrect,
      avgResponseTimeMs: avgResponseTime,
      streakDays,
    });

    setXpResult(result);

    // Award XP
    awardXP(result.totalXP).then(({ leveledUp: lu, newLevel }) => {
      setLeveledUp(lu);
      if (lu) {
        setNewLevelEmoji(newLevel.emoji);
        setNewLevelName(newLevel.name);
      }
    });
  }, [isFinished, correct, hard, incorrect, responseTimes, streakDays, awardXP]);

  // Handle flashcard answers with 3 quality levels
  const handleFlashcardAnswer = async (quality: AnswerQuality) => {
    const card = cards[currentIndex];
    if (!card || !sessionId) return;

    // Update local state
    if (quality === "good") answerCorrect();
    else if (quality === "hard") answerHard();
    else answerIncorrect();

    const srsQuality = QUALITY_MAP[quality];
    const wasCorrect = quality !== "again";

    const srs = calculateSRS(
      srsQuality,
      card.word.ease_factor,
      card.word.interval_days,
      card.word.repetitions,
    );

    // Persist review log + SRS update
    await Promise.all([
      supabase.from("review_logs").insert({
        session_id: sessionId,
        word_id: card.word.id,
        quality: srsQuality,
        was_correct: wasCorrect,
      }),
      supabase
        .from("words")
        .update({
          ease_factor: srs.easeFactor,
          interval_days: srs.interval,
          repetitions: srs.repetitions,
          next_review_at: srs.nextReviewAt.toISOString(),
        })
        .eq("id", card.word.id),
    ]);

    nextCard();
  };

  // Handle multiple choice / typing answers (boolean correct/incorrect)
  const handleBooleanAnswer = async (wasCorrect: boolean) => {
    const card = cards[currentIndex];
    if (!card || !sessionId) return;

    if (wasCorrect) answerCorrect();
    else answerIncorrect();

    const quality = wasCorrect ? 5 : 1;
    const srs = calculateSRS(
      quality,
      card.word.ease_factor,
      card.word.interval_days,
      card.word.repetitions,
    );

    await Promise.all([
      supabase.from("review_logs").insert({
        session_id: sessionId,
        word_id: card.word.id,
        quality,
        was_correct: wasCorrect,
      }),
      supabase
        .from("words")
        .update({
          ease_factor: srs.easeFactor,
          interval_days: srs.interval,
          repetitions: srs.repetitions,
          next_review_at: srs.nextReviewAt.toISOString(),
        })
        .eq("id", card.word.id),
    ]);

    nextCard();
  };

  const handleDone = async () => {
    if (sessionId) {
      const state = useTrainingStore.getState();
      const durationMs = state.startedAt ? Date.now() - state.startedAt : 0;
      const avgResponseTime =
        state.responseTimes.length > 0
          ? Math.round(
              state.responseTimes.reduce((a, b) => a + b, 0) /
                state.responseTimes.length,
            )
          : null;

      await supabase
        .from("training_sessions")
        .update({
          correct: state.correct,
          incorrect: state.incorrect + state.hard,
          finished_at: new Date().toISOString(),
          duration_seconds: Math.round(durationMs / 1000),
          avg_response_time_ms: avgResponseTime,
          xp_earned: xpResult?.totalXP ?? 0,
        })
        .eq("id", sessionId);
    }

    resetSession();
    router.push("/decks");
  };

  if (!sessionId || cards.length === 0) {
    router.replace("/decks");
    return null;
  }

  if (isFinished) {
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          )
        : 0;

    return (
      <Page className="h-screen">
        <SessionSummary
          correct={correct}
          hard={hard}
          incorrect={incorrect}
          duration={startedAt ? Date.now() - startedAt : 0}
          avgResponseTime={avgResponseTime}
          xpEarned={xpResult?.totalXP ?? 0}
          xpBase={xpResult?.baseXP ?? 0}
          xpSpeedBonus={xpResult?.speedBonus ?? 0}
          xpStreakMultiplier={xpResult?.streakMultiplier ?? 1}
          leveledUp={leveledUp}
          newLevelEmoji={newLevelEmoji}
          newLevelName={newLevelName}
          onDone={handleDone}
        />
      </Page>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  return (
    <Page className="h-screen flex flex-col">
      {/* Progress bar */}
      <div className="px-5 pt-safe-top pb-2">
        <div className="flex justify-between items-center mb-2.5 pt-3">
          <button
            onClick={() => {
              resetSession();
              router.back();
            }}
            className="text-blue-500 text-[15px] font-medium py-1"
          >
            Quit
          </button>
          <div className="flex items-center gap-3">
            {/* Optional timer */}
            {showTimer && <TrainingTimer startedAt={startedAt} />}
            <button
              onClick={() => setShowTimer(!showTimer)}
              className="p-1 -m-1"
            >
              <svg
                className={`w-4 h-4 ${showTimer ? "text-blue-400" : "text-gray-300"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <span className="text-[13px] text-gray-400 font-medium tabular-nums">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1">
        {mode === "flashcard" && (
          <FlashCard
            key={currentCard.word.id}
            word={currentCard.word}
            frontSide={frontSide}
            onAnswer={handleFlashcardAnswer}
          />
        )}
        {mode === "multiple_choice" && currentCard.options && (
          <MultipleChoice
            key={currentCard.word.id}
            word={currentCard.word}
            options={currentCard.options}
            onAnswer={handleBooleanAnswer}
          />
        )}
        {mode === "typing" && (
          <TypingChallenge
            key={currentCard.word.id}
            word={currentCard.word}
            onAnswer={handleBooleanAnswer}
          />
        )}
      </div>
    </Page>
  );
}

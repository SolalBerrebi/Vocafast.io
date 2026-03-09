"use client";

import { useRouter } from "next/navigation";
import { Page } from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useTrainingStore } from "@/stores/training-store";
import { calculateSRS } from "@/lib/srs/engine";
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

export default function TrainingSessionPage() {
  const router = useRouter();
  const supabase = createClient();

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
    answerCorrect,
    answerHard,
    answerIncorrect,
    nextCard,
    resetSession,
  } = useTrainingStore();

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
      await supabase
        .from("training_sessions")
        .update({
          correct: state.correct,
          incorrect: state.incorrect + state.hard,
          finished_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }

    resetSession();
    router.push("/decks");
  };

  if (!sessionId || cards.length === 0) {
    router.push("/decks");
    return null;
  }

  if (isFinished) {
    return (
      <Page className="h-screen">
        <SessionSummary
          correct={correct}
          hard={hard}
          incorrect={incorrect}
          duration={startedAt ? Date.now() - startedAt : 0}
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
          <span className="text-[13px] text-gray-400 font-medium tabular-nums">
            {currentIndex + 1} / {cards.length}
          </span>
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

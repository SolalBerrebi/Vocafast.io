"use client";

import { useRouter } from "next/navigation";
import { Page } from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useTrainingStore } from "@/stores/training-store";
import { calculateSRS, qualityFromCorrectness } from "@/lib/srs/engine";
import FlashCard from "@/components/training/FlashCard";
import MultipleChoice from "@/components/training/MultipleChoice";
import TypingChallenge from "@/components/training/TypingChallenge";
import SessionSummary from "@/components/training/SessionSummary";

export default function TrainingSessionPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    sessionId,
    mode,
    cards,
    currentIndex,
    correct,
    incorrect,
    startedAt,
    isFinished,
    answerCorrect,
    answerIncorrect,
    nextCard,
    resetSession,
  } = useTrainingStore();

  const handleAnswer = async (wasCorrect: boolean) => {
    const card = cards[currentIndex];
    if (!card || !sessionId) return;

    // Update local state
    if (wasCorrect) answerCorrect();
    else answerIncorrect();

    // Calculate SRS
    const quality = qualityFromCorrectness(wasCorrect);
    const srs = calculateSRS(
      quality,
      card.word.ease_factor,
      card.word.interval_days,
      card.word.repetitions,
    );

    // Persist review log + SRS update
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
    // Update session with final counts
    if (sessionId) {
      await supabase
        .from("training_sessions")
        .update({
          correct: useTrainingStore.getState().correct,
          incorrect: useTrainingStore.getState().incorrect,
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
          incorrect={incorrect}
          duration={startedAt ? Date.now() - startedAt : 0}
          onDone={handleDone}
        />
      </Page>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <Page className="h-screen flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => {
              resetSession();
              router.back();
            }}
            className="text-blue-500 text-sm font-medium"
          >
            Quit
          </button>
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1">
        {mode === "flashcard" && (
          <FlashCard word={currentCard.word} onAnswer={handleAnswer} />
        )}
        {mode === "multiple_choice" && currentCard.options && (
          <MultipleChoice
            word={currentCard.word}
            options={currentCard.options}
            onAnswer={handleAnswer}
          />
        )}
        {mode === "typing" && (
          <TypingChallenge word={currentCard.word} onAnswer={handleAnswer} />
        )}
      </div>
    </Page>
  );
}

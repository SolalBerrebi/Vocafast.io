"use client";

import { createClient } from "@/lib/supabase/client";
import { useTrainingStore } from "@/stores/training-store";
import { calculateSRS, qualityFromCorrectness } from "@/lib/srs/engine";

export function useTraining() {
  const supabase = createClient();
  const store = useTrainingStore();

  const submitAnswer = async (wasCorrect: boolean) => {
    const card = store.cards[store.currentIndex];
    if (!card || !store.sessionId) return;

    if (wasCorrect) store.answerCorrect();
    else store.answerIncorrect();

    const quality = qualityFromCorrectness(wasCorrect);
    const srs = calculateSRS(
      quality,
      card.word.ease_factor,
      card.word.interval_days,
      card.word.repetitions,
    );

    await Promise.all([
      supabase.from("review_logs").insert({
        session_id: store.sessionId,
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

    store.nextCard();
  };

  const finishSession = async () => {
    if (store.sessionId) {
      await supabase
        .from("training_sessions")
        .update({
          correct: store.correct,
          incorrect: store.incorrect,
          finished_at: new Date().toISOString(),
        })
        .eq("id", store.sessionId);
    }
    store.resetSession();
  };

  return { ...store, submitAnswer, finishSession };
}

import { createClient } from "@/lib/supabase/client";
import type { Word } from "@/types/database";

/**
 * Get words due for review in a deck
 */
export async function getDueWords(
  deckId: string,
  limit: number = 20,
): Promise<Word[]> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .lte("next_review_at", now)
    .order("next_review_at")
    .limit(limit);

  return (data as Word[]) ?? [];
}

/**
 * Get new words (never reviewed) from a deck
 */
export async function getNewWords(
  deckId: string,
  limit: number = 10,
): Promise<Word[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .eq("repetitions", 0)
    .order("created_at")
    .limit(limit);

  return (data as Word[]) ?? [];
}

/**
 * Build a training queue: due words first, then new words to fill remaining slots
 */
export async function buildTrainingQueue(
  deckId: string,
  sessionSize: number = 20,
): Promise<Word[]> {
  const due = await getDueWords(deckId, sessionSize);
  const remaining = sessionSize - due.length;

  let queue = [...due];

  if (remaining > 0) {
    const newWords = await getNewWords(deckId, remaining);
    queue = [...queue, ...newWords];
  }

  // Shuffle to mix due and new words
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  return queue;
}

import { createClient } from "@/lib/supabase/client";
import type { Word } from "@/types/database";

export type StudyScope = "smart" | "all" | "mistakes" | "new_only";

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
 * Get all words in a deck
 */
export async function getAllWords(
  deckId: string,
  limit: number = 50,
): Promise<Word[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at")
    .limit(limit);

  return (data as Word[]) ?? [];
}

/**
 * Get words the user struggled with (low ease factor or recently failed)
 */
export async function getMistakeWords(
  deckId: string,
  limit: number = 20,
): Promise<Word[]> {
  const supabase = createClient();

  // Words with low ease factor (struggled) or that were reset (repetitions = 0 but ease < default 2.5)
  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .lt("ease_factor", 2.2)
    .gt("repetitions", 0)
    .order("ease_factor")
    .limit(limit);

  // Also get words that were reset to 0 repetitions (failed badly)
  const { data: resetWords } = await supabase
    .from("words")
    .select("*")
    .eq("deck_id", deckId)
    .eq("repetitions", 0)
    .lt("ease_factor", 2.5)
    .neq("interval_days", 0)
    .order("ease_factor")
    .limit(limit);

  const all = [...((data as Word[]) ?? []), ...((resetWords as Word[]) ?? [])];
  // Deduplicate
  const seen = new Set<string>();
  return all.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  }).slice(0, limit);
}

/**
 * Get deck word counts for the training launcher
 */
export async function getDeckStats(deckId: string): Promise<{
  total: number;
  due: number;
  newCount: number;
  learning: number;
  mastered: number;
}> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: allWords } = await supabase
    .from("words")
    .select("repetitions, next_review_at, interval_days")
    .eq("deck_id", deckId);

  const words = allWords ?? [];
  const total = words.length;
  const newCount = words.filter((w) => w.repetitions === 0).length;
  const due = words.filter(
    (w) => w.repetitions > 0 && w.next_review_at && w.next_review_at <= now,
  ).length;
  const mastered = words.filter((w) => w.interval_days >= 21).length;
  const learning = total - newCount - mastered;

  return { total, due, newCount, learning, mastered };
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Build a training queue based on study scope
 */
export async function buildTrainingQueue(
  deckId: string,
  scope: StudyScope = "smart",
  sessionSize: number = 20,
): Promise<Word[]> {
  let queue: Word[];

  switch (scope) {
    case "all": {
      const all = await getAllWords(deckId, sessionSize);
      queue = shuffle(all);
      break;
    }
    case "mistakes": {
      const mistakes = await getMistakeWords(deckId, sessionSize);
      queue = shuffle(mistakes);
      break;
    }
    case "new_only": {
      const newWords = await getNewWords(deckId, sessionSize);
      queue = shuffle(newWords);
      break;
    }
    case "smart":
    default: {
      const due = await getDueWords(deckId, sessionSize);
      const remaining = sessionSize - due.length;
      queue = [...due];
      if (remaining > 0) {
        const newWords = await getNewWords(deckId, remaining);
        queue = [...queue, ...newWords];
      }
      queue = shuffle(queue);
      break;
    }
  }

  return queue;
}

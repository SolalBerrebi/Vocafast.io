export interface Profile {
  id: string;
  display_name: string | null;
  native_lang: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LanguageEnvironment {
  id: string;
  user_id: string;
  target_lang: string;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  environment_id: string;
  name: string;
  color: string;
  icon: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export type WordSourceType = "manual" | "photo" | "audio" | "conversation";

export interface Word {
  id: string;
  deck_id: string;
  word: string;
  translation: string;
  source_type: WordSourceType;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  created_at: string;
  updated_at: string;
}

export type TrainingMode = "flashcard" | "multiple_choice" | "typing";

export interface TrainingSession {
  id: string;
  environment_id: string;
  deck_id: string | null;
  mode: TrainingMode;
  correct: number;
  incorrect: number;
  started_at: string;
  finished_at: string | null;
}

export interface ReviewLog {
  id: string;
  session_id: string;
  word_id: string;
  quality: number; // 0-5 SM-2 quality rating
  was_correct: boolean;
  created_at: string;
}

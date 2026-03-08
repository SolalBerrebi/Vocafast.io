import type { TrainingMode, Word } from "./database";

export interface TrainingCard {
  word: Word;
  options?: string[]; // for multiple choice
}

export interface TrainingState {
  sessionId: string | null;
  mode: TrainingMode;
  cards: TrainingCard[];
  currentIndex: number;
  correct: number;
  incorrect: number;
  startedAt: number;
  isFinished: boolean;
}

export interface SRSUpdate {
  wordId: string;
  quality: number;
  wasCorrect: boolean;
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
  nextReviewAt: string;
}

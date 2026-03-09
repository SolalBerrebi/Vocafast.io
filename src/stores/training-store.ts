import { create } from "zustand";
import type { TrainingMode } from "@/types/database";
import type { TrainingCard } from "@/types/training";

interface TrainingStoreState {
  sessionId: string | null;
  mode: TrainingMode;
  cards: TrainingCard[];
  currentIndex: number;
  correct: number;
  hard: number;
  incorrect: number;
  startedAt: number | null;
  isFinished: boolean;

  startSession: (params: {
    sessionId: string;
    mode: TrainingMode;
    cards: TrainingCard[];
  }) => void;
  answerCorrect: () => void;
  answerHard: () => void;
  answerIncorrect: () => void;
  nextCard: () => void;
  finishSession: () => void;
  resetSession: () => void;
}

export const useTrainingStore = create<TrainingStoreState>()((set) => ({
  sessionId: null,
  mode: "flashcard",
  cards: [],
  currentIndex: 0,
  correct: 0,
  hard: 0,
  incorrect: 0,
  startedAt: null,
  isFinished: false,

  startSession: ({ sessionId, mode, cards }) =>
    set({
      sessionId,
      mode,
      cards,
      currentIndex: 0,
      correct: 0,
      hard: 0,
      incorrect: 0,
      startedAt: Date.now(),
      isFinished: false,
    }),

  answerCorrect: () => set((s) => ({ correct: s.correct + 1 })),
  answerHard: () => set((s) => ({ hard: s.hard + 1 })),
  answerIncorrect: () => set((s) => ({ incorrect: s.incorrect + 1 })),

  nextCard: () =>
    set((s) => {
      const next = s.currentIndex + 1;
      return next >= s.cards.length
        ? { currentIndex: next, isFinished: true }
        : { currentIndex: next };
    }),

  finishSession: () => set({ isFinished: true }),
  resetSession: () =>
    set({
      sessionId: null,
      cards: [],
      currentIndex: 0,
      correct: 0,
      hard: 0,
      incorrect: 0,
      startedAt: null,
      isFinished: false,
    }),
}));

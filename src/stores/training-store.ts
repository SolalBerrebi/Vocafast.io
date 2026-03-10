import { create } from "zustand";
import type { TrainingMode } from "@/types/database";
import type { TrainingCard } from "@/types/training";

export type CardFrontSide = "word" | "translation";

interface TrainingStoreState {
  sessionId: string | null;
  mode: TrainingMode;
  frontSide: CardFrontSide;
  cards: TrainingCard[];
  currentIndex: number;
  correct: number;
  hard: number;
  incorrect: number;
  startedAt: number | null;
  isFinished: boolean;
  cardStartedAt: number | null;
  responseTimes: number[];

  startSession: (params: {
    sessionId: string;
    mode: TrainingMode;
    cards: TrainingCard[];
    frontSide?: CardFrontSide;
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
  frontSide: "word",
  cards: [],
  currentIndex: 0,
  correct: 0,
  hard: 0,
  incorrect: 0,
  startedAt: null,
  isFinished: false,
  cardStartedAt: null,
  responseTimes: [],

  startSession: ({ sessionId, mode, cards, frontSide }) =>
    set({
      sessionId,
      mode,
      frontSide: frontSide ?? "word",
      cards,
      currentIndex: 0,
      correct: 0,
      hard: 0,
      incorrect: 0,
      startedAt: Date.now(),
      isFinished: false,
      cardStartedAt: Date.now(),
      responseTimes: [],
    }),

  answerCorrect: () => set((s) => ({ correct: s.correct + 1 })),
  answerHard: () => set((s) => ({ hard: s.hard + 1 })),
  answerIncorrect: () => set((s) => ({ incorrect: s.incorrect + 1 })),

  nextCard: () =>
    set((s) => {
      const responseTime = s.cardStartedAt ? Date.now() - s.cardStartedAt : 0;
      const newResponseTimes = [...s.responseTimes, responseTime];
      const next = s.currentIndex + 1;
      return next >= s.cards.length
        ? {
            currentIndex: next,
            isFinished: true,
            cardStartedAt: null,
            responseTimes: newResponseTimes,
          }
        : {
            currentIndex: next,
            cardStartedAt: Date.now(),
            responseTimes: newResponseTimes,
          };
    }),

  finishSession: () => set({ isFinished: true }),
  resetSession: () =>
    set({
      sessionId: null,
      frontSide: "word",
      cards: [],
      currentIndex: 0,
      correct: 0,
      hard: 0,
      incorrect: 0,
      startedAt: null,
      isFinished: false,
      cardStartedAt: null,
      responseTimes: [],
    }),
}));

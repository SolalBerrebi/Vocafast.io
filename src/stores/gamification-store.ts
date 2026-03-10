import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GamificationState {
  totalXp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  showTimer: boolean;

  setXp: (xp: number) => void;
  addXp: (amount: number) => void;
  setLevel: (level: number) => void;
  setStreak: (days: number, date: string) => void;
  setShowTimer: (show: boolean) => void;
  hydrate: (data: {
    totalXp: number;
    level: number;
    streakDays: number;
    lastActiveDate: string | null;
    showTimer: boolean;
  }) => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set) => ({
      totalXp: 0,
      level: 1,
      streakDays: 0,
      lastActiveDate: null,
      showTimer: true,

      setXp: (xp) => set({ totalXp: xp }),
      addXp: (amount) =>
        set((s) => ({ totalXp: s.totalXp + amount })),
      setLevel: (level) => set({ level }),
      setStreak: (days, date) =>
        set({ streakDays: days, lastActiveDate: date }),
      setShowTimer: (show) => set({ showTimer: show }),
      hydrate: (data) => set(data),
    }),
    {
      name: "vocafast-gamification",
    },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageEnvironment } from "@/types/database";

interface EnvironmentState {
  activeEnvironmentId: string | null;
  environments: LanguageEnvironment[];
  setActiveEnvironment: (id: string) => void;
  setEnvironments: (envs: LanguageEnvironment[]) => void;
  addEnvironment: (env: LanguageEnvironment) => void;
  removeEnvironment: (id: string) => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set) => ({
      activeEnvironmentId: null,
      environments: [],
      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),
      setEnvironments: (envs) =>
        set((state) => ({
          environments: envs,
          activeEnvironmentId:
            // Keep persisted activeEnvironmentId if it still exists in the list
            state.activeEnvironmentId &&
            envs.some((e) => e.id === state.activeEnvironmentId)
              ? state.activeEnvironmentId
              : envs.find((e) => e.is_active)?.id ?? envs[0]?.id ?? null,
        })),
      addEnvironment: (env) =>
        set((state) => ({
          environments: [...state.environments, env],
          activeEnvironmentId: env.is_active
            ? env.id
            : state.activeEnvironmentId,
        })),
      removeEnvironment: (id) =>
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
          activeEnvironmentId:
            state.activeEnvironmentId === id
              ? state.environments.find((e) => e.id !== id)?.id ?? null
              : state.activeEnvironmentId,
        })),
    }),
    {
      name: "vocafast-environment",
    },
  ),
);

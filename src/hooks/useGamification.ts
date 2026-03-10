"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGamificationStore } from "@/stores/gamification-store";
import { getLevelForXP } from "@/lib/gamification/levels";
import type { Level } from "@/lib/gamification/levels";

export function useGamification() {
  const supabase = createClient();
  const store = useGamificationStore();
  const fetched = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("total_xp, level, streak_days, last_active_date, show_timer")
      .eq("id", user.id)
      .single();

    if (data) {
      store.hydrate({
        totalXp: data.total_xp ?? 0,
        level: data.level ?? 1,
        streakDays: data.streak_days ?? 0,
        lastActiveDate: data.last_active_date ?? null,
        showTimer: data.show_timer ?? true,
      });
    }
  }, [supabase, store]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const awardXP = async (
    amount: number,
  ): Promise<{ leveledUp: boolean; newLevel: Level }> => {
    const currentLevel = store.level;
    const newTotal = store.totalXp + amount;
    const newLevel = getLevelForXP(newTotal);
    const leveledUp = newLevel.level > currentLevel;

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    let newStreak = store.streakDays;
    if (store.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      newStreak =
        store.lastActiveDate === yesterday ? store.streakDays + 1 : 1;
      store.setStreak(newStreak, today);
    }

    // Update local store immediately
    store.setXp(newTotal);
    store.setLevel(newLevel.level);

    // Persist to DB
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          total_xp: newTotal,
          level: newLevel.level,
          streak_days: newStreak,
          last_active_date: today,
        })
        .eq("id", user.id);
    }

    return { leveledUp, newLevel };
  };

  const toggleTimer = async (show: boolean) => {
    store.setShowTimer(show);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ show_timer: show })
        .eq("id", user.id);
    }
  };

  return {
    totalXp: store.totalXp,
    level: store.level,
    streakDays: store.streakDays,
    lastActiveDate: store.lastActiveDate,
    showTimer: store.showTimer,
    awardXP,
    toggleTimer,
    fetchProfile,
  };
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Preloader } from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import StatsCard from "@/components/progress/StatsCard";
import StreakCalendar from "@/components/progress/StreakCalendar";

interface Stats {
  totalWords: number;
  masteredWords: number;
  totalSessions: number;
  totalCorrect: number;
  totalIncorrect: number;
  sessionDates: string[];
}

export default function ProgressPage() {
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!activeEnvironmentId) {
      setLoading(false);
      return;
    }

    const { data: decks } = await supabase
      .from("decks")
      .select("id, word_count")
      .eq("environment_id", activeEnvironmentId);

    const deckIds = decks?.map((d) => d.id) ?? [];
    const totalWords = decks?.reduce((sum, d) => sum + d.word_count, 0) ?? 0;

    let masteredWords = 0;
    if (deckIds.length > 0) {
      const { count } = await supabase
        .from("words")
        .select("*", { count: "exact", head: true })
        .in("deck_id", deckIds)
        .gte("repetitions", 3);
      masteredWords = count ?? 0;
    }

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("correct, incorrect, started_at")
      .eq("environment_id", activeEnvironmentId)
      .not("finished_at", "is", null);

    const totalSessions = sessions?.length ?? 0;
    const totalCorrect = sessions?.reduce((s, t) => s + t.correct, 0) ?? 0;
    const totalIncorrect = sessions?.reduce((s, t) => s + t.incorrect, 0) ?? 0;
    const sessionDates =
      sessions?.map((s) => s.started_at.split("T")[0]) ?? [];

    setStats({
      totalWords,
      masteredWords,
      totalSessions,
      totalCorrect,
      totalIncorrect,
      sessionDates: [...new Set(sessionDates)],
    });
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnvironmentId]);

  useEffect(() => {
    setLoading(true);
    setStats(null);
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="px-5 pt-4 pb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-5">Progress</h1>
        <div className="flex justify-center mt-16">
          <Preloader />
        </div>
      </div>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="px-5 pt-4 pb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-5">Progress</h1>
        <div className="text-center mt-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold tracking-tight">No progress yet</h2>
          <p className="text-gray-400 mt-2 text-[15px]">
            Complete a training session to see your stats
          </p>
        </div>
      </div>
    );
  }

  const accuracy =
    stats.totalCorrect + stats.totalIncorrect > 0
      ? Math.round(
          (stats.totalCorrect / (stats.totalCorrect + stats.totalIncorrect)) *
            100,
        )
      : 0;

  return (
    <div className="px-5 pt-4 pb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-5">Progress</h1>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <StatsCard label="Total Words" value={stats.totalWords} icon="📚" />
        <StatsCard label="Mastered" value={stats.masteredWords} icon="⭐" />
        <StatsCard label="Sessions" value={stats.totalSessions} icon="🧠" />
        <StatsCard label="Accuracy" value={`${accuracy}%`} icon="🎯" />
      </div>

      <div className="mb-4">
        <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Study Activity</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <StreakCalendar activeDates={stats.sessionDates} />
        </div>
      </div>
    </div>
  );
}

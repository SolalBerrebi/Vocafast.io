"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Preloader } from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import { useTrainingStore } from "@/stores/training-store";
import { buildTrainingQueue, getDeckStats } from "@/lib/srs/scheduler";
import type { StudyScope } from "@/lib/srs/scheduler";
import type { Deck, TrainingMode, Word } from "@/types/database";

const SESSION_SIZES = [5, 10, 15, 20];

const SCOPES: { key: StudyScope; label: string; desc: string; icon: string }[] = [
  { key: "smart", label: "Smart Review", desc: "Due + new words (SRS)", icon: "🧠" },
  { key: "all", label: "All Words", desc: "Practice everything", icon: "📚" },
  { key: "mistakes", label: "Difficult Words", desc: "Words you've struggled with", icon: "💪" },
  { key: "new_only", label: "New Only", desc: "Unreviewed words", icon: "✨" },
];

const MODES: { key: TrainingMode; label: string; desc: string; icon: string }[] = [
  { key: "flashcard", label: "Flashcards", desc: "Flip to reveal", icon: "🃏" },
  { key: "multiple_choice", label: "Multiple Choice", desc: "Pick the correct answer", icon: "📝" },
  { key: "typing", label: "Typing", desc: "Type the translation", icon: "⌨️" },
];

export default function TrainLauncherPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const startSession = useTrainingStore((s) => s.startSession);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState({ total: 0, due: 0, newCount: 0, learning: 0, mastered: 0 });
  const [mode, setMode] = useState<TrainingMode>("flashcard");
  const [scope, setScope] = useState<StudyScope>("smart");
  const [sessionSize, setSessionSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchData = useCallback(async () => {
    const [deckRes, deckStats] = await Promise.all([
      supabase.from("decks").select("*").eq("id", deckId).single(),
      getDeckStats(deckId),
    ]);
    setDeck(deckRes.data as Deck | null);
    setStats(deckStats);
    setLoading(false);
  }, [deckId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (stats.due > 0 || stats.newCount > 0) {
      setScope("smart");
    } else if (stats.total > 0) {
      setScope("all");
    }
  }, [stats]);

  const handleStart = async () => {
    if (!activeEnvironmentId || stats.total === 0) return;
    setStarting(true);

    const availableWords = await buildTrainingQueue(deckId, scope, sessionSize);

    if (availableWords.length === 0) {
      setStarting(false);
      return;
    }

    const { data: session } = await supabase
      .from("training_sessions")
      .insert({
        environment_id: activeEnvironmentId,
        deck_id: deckId,
        mode,
      })
      .select()
      .single();

    if (!session) {
      setStarting(false);
      return;
    }

    const cards = availableWords.map((word: Word) => {
      if (mode === "multiple_choice") {
        const others = availableWords
          .filter((w: Word) => w.id !== word.id)
          .map((w: Word) => w.translation);
        const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...shuffled, word.translation].sort(
          () => Math.random() - 0.5,
        );
        return { word, options };
      }
      return { word };
    });

    startSession({ sessionId: session.id, mode, cards });
    router.push(`/train/${session.id}`);
  };

  if (loading) {
    return (
      <div className="px-5 pt-2 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex justify-center mt-16">
          <Preloader />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2 pb-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-3"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-5">{deck?.name ?? "Train"}</h1>

      {/* Deck stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-blue-50 rounded-2xl py-3 text-center">
          <p className="text-lg font-bold text-blue-600">{stats.due}</p>
          <p className="text-[10px] text-blue-400 font-semibold">Due</p>
        </div>
        <div className="bg-purple-50 rounded-2xl py-3 text-center">
          <p className="text-lg font-bold text-purple-600">{stats.newCount}</p>
          <p className="text-[10px] text-purple-400 font-semibold">New</p>
        </div>
        <div className="bg-orange-50 rounded-2xl py-3 text-center">
          <p className="text-lg font-bold text-orange-600">{stats.learning}</p>
          <p className="text-[10px] text-orange-400 font-semibold">Learning</p>
        </div>
        <div className="bg-green-50 rounded-2xl py-3 text-center">
          <p className="text-lg font-bold text-green-600">{stats.mastered}</p>
          <p className="text-[10px] text-green-400 font-semibold">Mastered</p>
        </div>
      </div>

      {/* Study scope */}
      <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">What to study</h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 mb-6">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`w-full px-4 py-3.5 flex items-center gap-3 transition-colors ${
              scope === s.key ? "bg-blue-50/50" : "active:bg-gray-50"
            }`}
          >
            <span className="text-lg">{s.icon}</span>
            <div className="flex-1 text-left">
              <p className={`text-[15px] font-medium ${scope === s.key ? "text-blue-600" : "text-gray-800"}`}>{s.label}</p>
              <p className="text-[12px] text-gray-400">{s.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              scope === s.key ? "border-blue-500" : "border-gray-300"
            }`}>
              {scope === s.key && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </div>
          </button>
        ))}
      </div>

      {/* Training mode */}
      <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">How to study</h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 mb-6">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`w-full px-4 py-3.5 flex items-center gap-3 transition-colors ${
              mode === m.key ? "bg-blue-50/50" : "active:bg-gray-50"
            }`}
          >
            <span className="text-lg">{m.icon}</span>
            <div className="flex-1 text-left">
              <p className={`text-[15px] font-medium ${mode === m.key ? "text-blue-600" : "text-gray-800"}`}>{m.label}</p>
              <p className="text-[12px] text-gray-400">{m.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              mode === m.key ? "border-blue-500" : "border-gray-300"
            }`}>
              {mode === m.key && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </div>
          </button>
        ))}
      </div>

      {/* Session size */}
      <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Session size</h2>
      <div className="flex gap-2 mb-8">
        {SESSION_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setSessionSize(size)}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
              sessionSize === size
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Start */}
      <button
        onClick={handleStart}
        disabled={stats.total === 0 || starting}
        className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {starting ? "Starting..." : "Start Training"}
      </button>
    </div>
  );
}

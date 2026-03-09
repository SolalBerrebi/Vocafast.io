"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";

const COLORS = [
  "#007AFF",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
];

const ICONS = ["📚", "🔤", "✈️", "🍕", "💼", "🏠", "🎵", "🎮", "💪", "🌍"];

export default function NewDeckPage() {
  const router = useRouter();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !activeEnvironmentId) return;
    setLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("decks")
      .insert({
        environment_id: activeEnvironmentId,
        name: name.trim(),
        color,
        icon,
      })
      .select()
      .single();

    if (data) {
      router.push(`/decks/${data.id}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pt-2 pb-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">New Deck</h1>

      {/* Preview */}
      <div className="flex justify-center mb-8">
        <div
          className="w-20 h-20 rounded-[18px] flex items-center justify-center text-4xl"
          style={{ backgroundColor: color + "15" }}
        >
          {icon}
        </div>
      </div>

      {/* Name input */}
      <div className="mb-6">
        <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Name</label>
        <input
          type="text"
          placeholder="Deck name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      {/* Color picker */}
      <div className="mb-6">
        <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Color</label>
        <div className="flex gap-3 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full transition-all ${
                color === c ? "ring-2 ring-offset-2 ring-gray-800 scale-110" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div className="mb-8">
        <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Icon</label>
        <div className="flex gap-2.5 flex-wrap">
          {ICONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                icon === i
                  ? "bg-blue-50 ring-2 ring-blue-500"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!name.trim() || loading}
        className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {loading ? "Creating..." : "Create Deck"}
      </button>
    </div>
  );
}

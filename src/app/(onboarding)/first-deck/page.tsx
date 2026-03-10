"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";

const DECK_PRESETS = [
  { name: "Basics", icon: "🔤", color: "#007AFF" },
  { name: "Travel", icon: "✈️", color: "#FF9500" },
  { name: "Food & Drinks", icon: "🍕", color: "#FF3B30" },
  { name: "Business", icon: "💼", color: "#5856D6" },
  { name: "Daily Life", icon: "🏠", color: "#34C759" },
];

export default function FirstDeckPage() {
  const router = useRouter();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const [deckName, setDeckName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const name = selectedPreset !== null ? DECK_PRESETS[selectedPreset].name : deckName;
    if (!name || !activeEnvironmentId) return;
    setLoading(true);

    const preset = selectedPreset !== null ? DECK_PRESETS[selectedPreset] : null;

    const supabase = createClient();

    await supabase.from("decks").insert({
      environment_id: activeEnvironmentId,
      name,
      icon: preset?.icon ?? "📚",
      color: preset?.color ?? "#007AFF",
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    }

    router.push("/decks");
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-1 rounded-full bg-blue-500" />
          <div className="flex-1 h-1 rounded-full bg-blue-500" />
          <div className="flex-1 h-1 rounded-full bg-blue-500" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Create your first deck</h1>
          <p className="text-gray-400 mt-2 text-[15px]">
            Pick a topic or create your own
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {DECK_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelectedPreset(i);
                setDeckName("");
              }}
              className={`p-4 rounded-2xl text-left transition-all ${
                selectedPreset === i
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "bg-white border-2 border-gray-100 active:bg-gray-50"
              }`}
            >
              <span className="text-3xl">{preset.icon}</span>
              <p className={`font-semibold text-[14px] mt-2 ${
                selectedPreset === i ? "text-blue-600" : "text-gray-800"
              }`}>{preset.name}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[13px] text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <input
          type="text"
          placeholder="Custom deck name"
          value={deckName}
          onChange={(e) => {
            setDeckName(e.target.value);
            setSelectedPreset(null);
          }}
          className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-white/0">
        <button
          onClick={handleCreate}
          disabled={(!deckName && selectedPreset === null) || loading}
          className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? "Creating..." : "Create Deck"}
        </button>
      </div>
    </div>
  );
}

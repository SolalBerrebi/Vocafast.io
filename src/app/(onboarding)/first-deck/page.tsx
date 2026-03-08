"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  Block,
  Button,
  List,
  ListInput,
} from "konsta/react";
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

    // Create deck
    await supabase.from("decks").insert({
      environment_id: activeEnvironmentId,
      name,
      icon: preset?.icon ?? "📚",
      color: preset?.color ?? "#007AFF",
    });

    // Mark onboarding complete
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
    <>
      <Navbar title="Step 3 of 3" />
      <Block className="text-center mt-4">
        <h1 className="text-2xl font-bold">Create your first deck</h1>
        <p className="text-gray-500 mt-2">
          Pick a topic or create your own
        </p>
      </Block>

      <Block>
        <div className="grid grid-cols-2 gap-3">
          {DECK_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelectedPreset(i);
                setDeckName("");
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPreset === i
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-3xl">{preset.icon}</span>
              <p className="font-semibold mt-2">{preset.name}</p>
            </button>
          ))}
        </div>
      </Block>

      <Block className="text-center text-gray-400 text-sm">or</Block>

      <List strongIos insetIos>
        <ListInput
          type="text"
          placeholder="Custom deck name"
          value={deckName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDeckName(e.target.value);
            setSelectedPreset(null);
          }}
        />
      </List>

      <Block>
        <Button
          large
          onClick={handleCreate}
          disabled={
            (!deckName && selectedPreset === null) || loading
          }
        >
          {loading ? "Creating..." : "Create Deck"}
        </Button>
      </Block>
    </>
  );
}

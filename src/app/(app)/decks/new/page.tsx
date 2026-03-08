"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBackLink,
  Block,
  List,
  ListInput,
  Button,
} from "konsta/react";
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
    <>
      <Navbar
        title="New Deck"
        left={<NavbarBackLink onClick={() => router.back()} />}
      />

      <Block className="text-center mt-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto"
          style={{ backgroundColor: color + "20" }}
        >
          {icon}
        </div>
      </Block>

      <List strongIos insetIos>
        <ListInput
          type="text"
          placeholder="Deck name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
      </List>

      <Block>
        <p className="text-sm font-semibold text-gray-500 mb-2">Color</p>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                color === c ? "border-gray-800 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Block>

      <Block>
        <p className="text-sm font-semibold text-gray-500 mb-2">Icon</p>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 transition-all ${
                icon === i
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </Block>

      <Block>
        <Button
          large
          onClick={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? "Creating..." : "Create Deck"}
        </Button>
      </Block>
    </>
  );
}

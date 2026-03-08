"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBackLink,
  Block,
  List,
  ListInput,
  Button,
  BlockTitle,
} from "konsta/react";
import { createClient } from "@/lib/supabase/client";

export default function AddWordsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<{ word: string; translation: string }[]>(
    [],
  );

  const handleAdd = async () => {
    if (!word.trim() || !translation.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("words").insert({
      deck_id: deckId,
      word: word.trim(),
      translation: translation.trim(),
      source_type: "manual",
    });

    if (!error) {
      setAdded((prev) => [
        { word: word.trim(), translation: translation.trim() },
        ...prev,
      ]);
      setWord("");
      setTranslation("");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar
        title="Add Words"
        left={<NavbarBackLink onClick={() => router.back()} />}
      />

      <BlockTitle>Manual Entry</BlockTitle>
      <List strongIos insetIos>
        <ListInput
          type="text"
          placeholder="Word (target language)"
          value={word}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setWord(e.target.value)
          }
        />
        <ListInput
          type="text"
          placeholder="Translation (your language)"
          value={translation}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTranslation(e.target.value)
          }
        />
      </List>

      <Block>
        <Button
          large
          onClick={handleAdd}
          disabled={!word.trim() || !translation.trim() || loading}
        >
          {loading ? "Adding..." : "Add Word"}
        </Button>
      </Block>

      {/* AI input methods placeholder */}
      <BlockTitle>Other Input Methods</BlockTitle>
      <Block>
        <div className="grid grid-cols-3 gap-3">
          <button className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center opacity-50">
            <span className="text-2xl block">📷</span>
            <span className="text-xs text-gray-500 mt-1 block">Photo</span>
          </button>
          <button className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center opacity-50">
            <span className="text-2xl block">🎤</span>
            <span className="text-xs text-gray-500 mt-1 block">Audio</span>
          </button>
          <button className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center opacity-50">
            <span className="text-2xl block">💬</span>
            <span className="text-xs text-gray-500 mt-1 block">Chat</span>
          </button>
        </div>
      </Block>

      {added.length > 0 && (
        <>
          <BlockTitle>Recently Added</BlockTitle>
          <List strongIos insetIos>
            {added.map((item, i) => (
              <li
                key={i}
                className="flex justify-between px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <span className="font-medium">{item.word}</span>
                <span className="text-gray-500">{item.translation}</span>
              </li>
            ))}
          </List>
        </>
      )}
    </>
  );
}

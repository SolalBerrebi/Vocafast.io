"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBackLink,
  Block,
  List,
  ListInput,
  ListItem,
  Button,
  BlockTitle,
  Preloader,
  Checkbox,
} from "konsta/react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironment } from "@/hooks/useEnvironment";
import { TOPICS } from "@/lib/ai/topics";
import type { WordSourceType } from "@/types/database";

interface ExtractedWord {
  word: string;
  translation: string;
  selected: boolean;
}

export default function AddWordsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const { activeEnvironment } = useEnvironment();
  const [nativeLang, setNativeLang] = useState("en");

  // Manual entry state
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<{ word: string; translation: string }[]>([]);

  // AI text extraction state
  const [textInput, setTextInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedWord[]>([]);

  // Topic generation state
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicWords, setTopicWords] = useState<ExtractedWord[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState<"manual" | "text" | "topic">("manual");

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("native_lang")
        .eq("id", user.id)
        .single();
      if (data) setNativeLang(data.native_lang);
    };
    fetchProfile();
  }, []);

  const handleAdd = async () => {
    if (!word.trim() || !translation.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("words").insert({
      deck_id: deckId,
      word: word.trim(),
      translation: translation.trim(),
      context_sentence: context.trim() || null,
      source_type: "manual",
    });

    if (!error) {
      setAdded((prev) => [
        { word: word.trim(), translation: translation.trim() },
        ...prev,
      ]);
      setWord("");
      setTranslation("");
      setContext("");
    }
    setLoading(false);
  };

  // CAPT-01: Text extraction
  const handleExtract = async () => {
    if (!textInput.trim() || !activeEnvironment) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/extract-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textInput.trim(),
          sourceLang: nativeLang,
          targetLang: activeEnvironment.target_lang,
        }),
      });
      const data = await res.json();
      if (data.words) {
        setExtracted(data.words.map((w: { word: string; translation: string }) => ({
          ...w,
          selected: true,
        })));
      }
    } catch (err) {
      console.error("Extraction failed:", err);
    }
    setExtracting(false);
  };

  // CAPT-03: Save confirmed AI words
  const handleSaveExtracted = async (words: ExtractedWord[], sourceType: WordSourceType) => {
    const selected = words.filter((w) => w.selected);
    if (selected.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase.from("words").insert(
      selected.map((w) => ({
        deck_id: deckId,
        word: w.word,
        translation: w.translation,
        source_type: sourceType,
      })),
    );

    if (!error) {
      setAdded((prev) => [
        ...selected.map((w) => ({ word: w.word, translation: w.translation })),
        ...prev,
      ]);
      if (sourceType === "text") {
        setExtracted([]);
        setTextInput("");
      } else {
        setTopicWords([]);
        setSelectedTopic(null);
      }
    }
  };

  // CAPT-12/13: Topic generation
  const handleGenerateTopic = async (topicId: string) => {
    if (!activeEnvironment) return;
    setSelectedTopic(topicId);
    setGeneratingTopic(true);
    try {
      const res = await fetch("/api/ai/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          nativeLang,
          targetLang: activeEnvironment.target_lang,
        }),
      });
      const data = await res.json();
      if (data.words) {
        setTopicWords(data.words.map((w: { word: string; translation: string }) => ({
          ...w,
          selected: true,
        })));
      }
    } catch (err) {
      console.error("Topic generation failed:", err);
    }
    setGeneratingTopic(false);
  };

  const toggleWord = (index: number, list: "extracted" | "topic") => {
    const setter = list === "extracted" ? setExtracted : setTopicWords;
    setter((prev) =>
      prev.map((w, i) => (i === index ? { ...w, selected: !w.selected } : w)),
    );
  };

  return (
    <>
      <Navbar
        title="Add Words"
        left={<NavbarBackLink onClick={() => router.back()} />}
      />

      {/* Tab selector */}
      <Block className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(["manual", "text", "topic"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-black shadow-sm"
                : "text-gray-500"
            }`}
          >
            {tab === "manual" ? "Manual" : tab === "text" ? "Paste Text" : "Topics"}
          </button>
        ))}
      </Block>

      {/* Manual Entry */}
      {activeTab === "manual" && (
        <>
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
            <ListInput
              type="text"
              placeholder="Context sentence (optional)"
              value={context}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setContext(e.target.value)
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
        </>
      )}

      {/* Text Extraction (CAPT-01) */}
      {activeTab === "text" && (
        <>
          <Block>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste or type words here (one per line, or separated by commas)..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </Block>
          <Block>
            <Button
              large
              onClick={handleExtract}
              disabled={!textInput.trim() || extracting}
            >
              {extracting ? (
                <span className="flex items-center gap-2 justify-center">
                  <Preloader /> Extracting...
                </span>
              ) : (
                "Extract & Translate"
              )}
            </Button>
          </Block>

          {/* CAPT-03: Review extracted words */}
          {extracted.length > 0 && (
            <>
              <BlockTitle>
                Review Words ({extracted.filter((w) => w.selected).length} selected)
              </BlockTitle>
              <List strongIos insetIos>
                {extracted.map((w, i) => (
                  <ListItem
                    key={i}
                    title={w.word}
                    after={w.translation}
                    media={
                      <Checkbox
                        checked={w.selected}
                        onChange={() => toggleWord(i, "extracted")}
                      />
                    }
                  />
                ))}
              </List>
              <Block className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleSaveExtracted(extracted, "text")}
                >
                  Save Selected
                </Button>
                <Button
                  className="flex-1"
                  outline
                  onClick={() => setExtracted([])}
                >
                  Clear
                </Button>
              </Block>
            </>
          )}
        </>
      )}

      {/* Topic Generation (CAPT-12/13) */}
      {activeTab === "topic" && (
        <>
          {topicWords.length === 0 ? (
            <>
              <BlockTitle>Choose a Topic</BlockTitle>
              <Block>
                <div className="grid grid-cols-2 gap-3">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleGenerateTopic(topic.id)}
                      disabled={generatingTopic}
                      className={`p-4 rounded-2xl border text-center transition-colors ${
                        selectedTopic === topic.id && generatingTopic
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      <span className="text-2xl block">{topic.icon}</span>
                      <span className="text-sm font-medium mt-1 block">
                        {topic.name}
                      </span>
                      {selectedTopic === topic.id && generatingTopic && (
                        <span className="block mt-2">
                          <Preloader />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </Block>
            </>
          ) : (
            <>
              <BlockTitle>
                Review Words ({topicWords.filter((w) => w.selected).length} selected)
              </BlockTitle>
              <List strongIos insetIos>
                {topicWords.map((w, i) => (
                  <ListItem
                    key={i}
                    title={w.word}
                    after={w.translation}
                    media={
                      <Checkbox
                        checked={w.selected}
                        onChange={() => toggleWord(i, "topic")}
                      />
                    }
                  />
                ))}
              </List>
              <Block className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleSaveExtracted(topicWords, "topic")}
                >
                  Save Selected
                </Button>
                <Button
                  className="flex-1"
                  outline
                  onClick={() => {
                    setTopicWords([]);
                    setSelectedTopic(null);
                  }}
                >
                  Back to Topics
                </Button>
              </Block>
            </>
          )}
        </>
      )}

      {/* Recently added (shown across all tabs) */}
      {added.length > 0 && (
        <>
          <BlockTitle>Recently Added</BlockTitle>
          <List strongIos insetIos>
            {added.map((item, i) => (
              <ListItem
                key={i}
                title={item.word}
                after={item.translation}
              />
            ))}
          </List>
        </>
      )}
    </>
  );
}

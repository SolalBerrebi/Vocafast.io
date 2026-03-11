"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
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
import { TOPICS } from "@/lib/ai/topics";
import type { WordSourceType } from "@/types/database";

interface ExtractedWord {
  word: string;
  translation: string;
  selected: boolean;
}

type CaptureMethod = "topic" | "photo" | "text" | "manual" | null;

export default function AddWordsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [nativeLang, setNativeLang] = useState("en");
  const [targetLang, setTargetLang] = useState("");

  // Active method (null = method picker)
  const [activeMethod, setActiveMethod] = useState<CaptureMethod>(null);

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

  // Photo capture state
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoProgress, setPhotoProgress] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoWords, setPhotoWords] = useState<ExtractedWord[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Topic generation state
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicWords, setTopicWords] = useState<ExtractedWord[]>([]);
  const [topicError, setTopicError] = useState("");
  const [wordCount, setWordCount] = useState(15);
  const [vocabLevel, setVocabLevel] = useState("beginner");

  // Existing words in deck (for dedup)
  const [existingWords, setExistingWords] = useState<string[]>([]);

  // Text error
  const [textError, setTextError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, wordsRes, deckRes] = await Promise.all([
        supabase.from("profiles").select("native_lang").eq("id", user.id).single(),
        supabase.from("words").select("word").eq("deck_id", deckId),
        supabase.from("decks").select("environment_id").eq("id", deckId).single(),
      ]);

      if (profileRes.data) setNativeLang(profileRes.data.native_lang);
      if (wordsRes.data) setExistingWords(wordsRes.data.map((w) => w.word.toLowerCase()));

      if (deckRes.data) {
        const { data: envData } = await supabase
          .from("language_environments")
          .select("target_lang")
          .eq("id", deckRes.data.environment_id)
          .single();
        if (envData) setTargetLang(envData.target_lang);
      }
    };
    fetchData();
  }, [deckId]);

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
      setExistingWords((prev) => [...prev, word.trim().toLowerCase()]);
      setWord("");
      setTranslation("");
      setContext("");
    }
    setLoading(false);
  };

  const compressImage = (file: File, maxDim = 1200): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg", dataUrl });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelected = async (file: File) => {
    if (!targetLang) return;

    setPhotoProcessing(true);
    setPhotoProgress("Preparing image...");
    setPhotoWords([]);
    setPhotoError("");

    try {
      const { base64, mimeType, dataUrl } = await compressImage(file);
      setPhotoPreview(dataUrl);

      setPhotoProgress("Analyzing image with AI...");

      const res = await fetch("/api/ai/extract-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          targetLang: targetLang,
          nativeLang,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setPhotoError(`Server error (${res.status}). Please try again.`);
        setPhotoProgress("");
        setPhotoProcessing(false);
        return;
      }

      if (!res.ok) {
        setPhotoError(data.error || `Server error (${res.status})`);
        setPhotoProgress("");
        setPhotoProcessing(false);
        return;
      }

      if (data.error) {
        setPhotoError(data.error);
        setPhotoProgress("");
      } else if (data.words && data.words.length > 0) {
        setPhotoWords(
          data.words.map((w: { word: string; translation: string }) => ({
            ...w,
            selected: true,
          })),
        );
        setPhotoProgress("");
        setPhotoError("");
      } else {
        setPhotoError("No words found in this image. Try a different photo.");
        setPhotoProgress("");
      }
    } catch (err) {
      console.error("Photo extraction failed:", err);
      setPhotoError("Failed to process image. Please try again.");
      setPhotoProgress("");
    }
    setPhotoProcessing(false);
  };

  const handleSavePhotoWords = async () => {
    const selected = photoWords.filter((w) => w.selected);
    if (selected.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase.from("words").insert(
      selected.map((w) => ({
        deck_id: deckId,
        word: w.word,
        translation: w.translation,
        source_type: "photo" as WordSourceType,
      })),
    );

    if (!error) {
      setAdded((prev) => [
        ...selected.map((w) => ({ word: w.word, translation: w.translation })),
        ...prev,
      ]);
      setExistingWords((prev) => [...prev, ...selected.map((w) => w.word.toLowerCase())]);
      setPhotoWords([]);
      setPhotoPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!textInput.trim() || !targetLang) return;
    setExtracting(true);
    setTextError("");
    try {
      const res = await fetch("/api/ai/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textInput.trim(),
          nativeLang,
          targetLang,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTextError(data.error || "Failed to extract vocabulary");
      } else if (data.words && data.words.length > 0) {
        setExtracted(data.words.map((w: { word: string; translation: string }) => ({
          ...w,
          selected: true,
        })));
      } else {
        setTextError("No vocabulary found in this text. Try pasting different content.");
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      setTextError("Failed to extract vocabulary. Please try again.");
    }
    setExtracting(false);
  };

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
      setExistingWords((prev) => [
        ...prev,
        ...selected.map((w) => w.word.toLowerCase()),
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

  const handleGenerateTopic = async (topicName: string) => {
    if (!targetLang) return;
    setSelectedTopic(topicName);
    setGeneratingTopic(true);
    setTopicError("");
    try {
      const res = await fetch("/api/ai/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicName,
          nativeLang,
          targetLang: targetLang,
          existingWords: existingWords.slice(0, 100),
          wordCount,
          level: vocabLevel,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setTopicError(data.error);
      } else if (data.words && data.words.length > 0) {
        const filtered = data.words.filter(
          (w: { word: string }) => !existingWords.includes(w.word.toLowerCase()),
        );
        if (filtered.length > 0) {
          setTopicWords(filtered.map((w: { word: string; translation: string }) => ({
            ...w,
            selected: true,
          })));
        } else {
          setTopicError("All generated words are already in your deck. Try a different topic.");
        }
      } else {
        setTopicError("No words generated. Try a different topic.");
      }
    } catch (err) {
      console.error("Topic generation failed:", err);
      setTopicError("Failed to generate vocabulary. Please try again.");
    }
    setGeneratingTopic(false);
  };

  const toggleWord = (index: number, list: "extracted" | "topic" | "photo") => {
    const setter = list === "extracted" ? setExtracted : list === "topic" ? setTopicWords : setPhotoWords;
    setter((prev) =>
      prev.map((w, i) => (i === index ? { ...w, selected: !w.selected } : w)),
    );
  };

  const handleBackToMethods = () => {
    setActiveMethod(null);
  };

  return (
    <>
      <div className="px-5 pt-2 pb-2">
        {/* Back button */}
        <button
          onClick={() => activeMethod ? handleBackToMethods() : router.back()}
          className="flex items-center gap-1 text-blue-500 font-medium text-[15px] py-2 -ml-1 mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {activeMethod ? "All Methods" : "Back"}
        </button>

        {!activeMethod && (
          <>
            <h1 className="text-[26px] font-bold tracking-tight mb-1">Add Words</h1>
            <p className="text-[14px] text-gray-500 leading-snug mb-5">
              Choose how you want to add vocabulary to your deck. AI does the heavy lifting.
            </p>
          </>
        )}
      </div>

      {/* ===== METHOD PICKER ===== */}
      {!activeMethod && (
        <div className="px-5 pb-6">
          {/* PRIMARY: Topic Generation */}
          <button
            onClick={() => setActiveMethod("topic")}
            className="w-full text-left mb-3 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[16px] font-bold text-gray-900">AI Topic Generator</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Fastest</span>
                </div>
                <p className="text-[13px] text-gray-500 leading-snug">
                  Type any topic — &quot;cooking&quot;, &quot;at the airport&quot;, &quot;business meetings&quot; — and get instant vocabulary with translations. Choose your difficulty level.
                </p>
              </div>
            </div>
          </button>

          {/* PRIMARY: Photo Scan */}
          <button
            onClick={() => setActiveMethod("photo")}
            className="w-full text-left mb-3 rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[16px] font-bold text-gray-900">Smart Photo Scan</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Magic</span>
                </div>
                <p className="text-[13px] text-gray-500 leading-snug">
                  Snap a photo of anything — a restaurant menu, a street sign, a textbook page, product labels — and AI extracts the vocabulary for you.
                </p>
              </div>
            </div>
          </button>

          {/* SECONDARY ROW: Text + Manual */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveMethod("text")}
              className="flex-1 text-left rounded-2xl border border-gray-200 bg-white p-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center mb-2.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="text-[14px] font-bold text-gray-900 block mb-0.5">Paste Text</span>
              <span className="text-[12px] text-gray-400 leading-snug block">Paste a word list or paragraph</span>
            </button>

            <button
              onClick={() => setActiveMethod("manual")}
              className="flex-1 text-left rounded-2xl border border-gray-200 bg-white p-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center mb-2.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </div>
              <span className="text-[14px] font-bold text-gray-900 block mb-0.5">Type Manually</span>
              <span className="text-[12px] text-gray-400 leading-snug block">Add words one by one</span>
            </button>
          </div>

          {/* Word count badge */}
          {existingWords.length > 0 && (
            <div className="mt-4 text-center">
              <span className="text-[12px] text-gray-400">
                {existingWords.length} word{existingWords.length !== 1 ? "s" : ""} already in this deck
              </span>
            </div>
          )}
        </div>
      )}

      {/* ===== TOPIC GENERATION ===== */}
      {activeMethod === "topic" && (
        <>
          {topicWords.length === 0 ? (
            <>
              <div className="px-5 mb-1">
                <h2 className="text-[20px] font-bold tracking-tight mb-1">AI Topic Generator</h2>
                <p className="text-[13px] text-gray-400 leading-snug">
                  Describe any topic and AI generates vocabulary instantly. The more specific, the better — try &quot;ordering food at a restaurant&quot; or &quot;job interview phrases&quot;.
                </p>
              </div>

              {/* Custom topic input */}
              <Block>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    placeholder="e.g. cooking, animals, at the airport..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customTopic.trim()) {
                        handleGenerateTopic(customTopic.trim());
                      }
                    }}
                    disabled={generatingTopic}
                  />
                  <Button
                    onClick={() => handleGenerateTopic(customTopic.trim())}
                    disabled={!customTopic.trim() || generatingTopic}
                  >
                    {generatingTopic && selectedTopic === customTopic.trim() ? (
                      <Preloader />
                    ) : (
                      "Go"
                    )}
                  </Button>
                </div>
              </Block>

              {/* Vocabulary level selector */}
              <Block>
                <span className="text-[13px] font-semibold text-gray-500 mb-2 block">Difficulty</span>
                <div className="flex gap-1.5">
                  {[
                    { key: "starter", label: "Starter", icon: "🌱" },
                    { key: "beginner", label: "Beginner", icon: "📗" },
                    { key: "intermediate", label: "Inter.", icon: "📘" },
                    { key: "advanced", label: "Advanced", icon: "📕" },
                    { key: "native", label: "Native", icon: "🗣️" },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      onClick={() => setVocabLevel(lvl.key)}
                      className={`flex-1 py-2 px-1 rounded-xl text-center transition-colors ${
                        vocabLevel === lvl.key
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span className="text-sm block">{lvl.icon}</span>
                      <span className="text-[10px] font-semibold block mt-0.5 leading-tight">{lvl.label}</span>
                    </button>
                  ))}
                </div>
              </Block>

              {/* Word count selector */}
              <Block>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-gray-500">Number of words</span>
                  <span className="text-[13px] font-bold text-blue-500 tabular-nums">{wordCount}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>5</span>
                  <span>50</span>
                </div>
              </Block>

              {/* Error message */}
              {topicError && (
                <Block>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{topicError}</p>
                  </div>
                </Block>
              )}

              {/* Loading state */}
              {generatingTopic && (
                <Block className="text-center py-4">
                  <Preloader />
                  <p className="text-sm text-gray-400 mt-3">Generating {wordCount} words...</p>
                </Block>
              )}

              {/* Quick topic picks */}
              {!generatingTopic && (
                <>
                  <BlockTitle>Quick Topics</BlockTitle>
                  <Block>
                    <div className="grid grid-cols-3 gap-2">
                      {TOPICS.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => handleGenerateTopic(topic.name)}
                          disabled={generatingTopic}
                          className="p-3 rounded-2xl border border-gray-200 bg-gray-50 active:bg-gray-100 text-center transition-colors"
                        >
                          <span className="text-xl block">{topic.icon}</span>
                          <span className="text-[11px] font-medium mt-0.5 block text-gray-700 leading-tight">
                            {topic.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Block>
                </>
              )}
            </>
          ) : (
            <>
              <BlockTitle>
                {selectedTopic} — {topicWords.filter((w) => w.selected).length} selected
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
                    setTopicError("");
                  }}
                >
                  Back
                </Button>
              </Block>
            </>
          )}
        </>
      )}

      {/* ===== PHOTO CAPTURE ===== */}
      {activeMethod === "photo" && (
        <>
          {photoWords.length === 0 ? (
            <>
              <div className="px-5 mb-1">
                <h2 className="text-[20px] font-bold tracking-tight mb-1">Smart Photo Scan</h2>
                <p className="text-[13px] text-gray-400 leading-snug">
                  Point your camera at real-world text and AI will find the words worth learning. Works great with:
                </p>
              </div>

              {/* Use case examples */}
              <Block>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: "🍽️", label: "Restaurant menus" },
                    { icon: "🛣️", label: "Street signs" },
                    { icon: "📖", label: "Textbook pages" },
                    { icon: "🏷️", label: "Product labels" },
                    { icon: "📰", label: "Newspapers" },
                    { icon: "🗺️", label: "Maps & guides" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 py-1.5">
                      <span className="text-[16px]">{item.icon}</span>
                      <span className="text-[13px] text-gray-600">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Photo preview */}
                {photoPreview && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200">
                    <img
                      src={photoPreview}
                      alt="Captured"
                      className="w-full max-h-64 object-contain bg-gray-50"
                    />
                  </div>
                )}

                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelected(file);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelected(file);
                  }}
                />

                {/* Error message */}
                {photoError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{photoError}</p>
                  </div>
                )}

                {photoProcessing ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Preloader />
                    <p className="text-sm text-gray-500">{photoProgress}</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      large
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Take Photo
                      </span>
                    </Button>
                    <Button
                      className="flex-1"
                      large
                      outline
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Gallery
                      </span>
                    </Button>
                  </div>
                )}
              </Block>
            </>
          ) : (
            <>
              {/* Photo review with preview */}
              {photoPreview && (
                <Block>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 mb-2">
                    <img
                      src={photoPreview}
                      alt="Source"
                      className="w-full max-h-32 object-contain bg-gray-50"
                    />
                  </div>
                </Block>
              )}
              <BlockTitle>
                Review Words ({photoWords.filter((w) => w.selected).length} selected)
              </BlockTitle>
              <List strongIos insetIos>
                {photoWords.map((w, i) => (
                  <ListItem
                    key={i}
                    title={w.word}
                    after={w.translation}
                    media={
                      <Checkbox
                        checked={w.selected}
                        onChange={() => toggleWord(i, "photo")}
                      />
                    }
                  />
                ))}
              </List>
              <Block className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSavePhotoWords}
                >
                  Save Selected
                </Button>
                <Button
                  className="flex-1"
                  outline
                  onClick={() => {
                    setPhotoWords([]);
                    setPhotoPreview(null);
                  }}
                >
                  Retake
                </Button>
              </Block>
            </>
          )}
        </>
      )}

      {/* ===== TEXT EXTRACTION ===== */}
      {activeMethod === "text" && (
        <>
          <div className="px-5 mb-1">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Paste Text</h2>
            <p className="text-[13px] text-gray-400 leading-snug">
              Paste any text — a word list, a paragraph from a book, sentences from a chat. AI extracts and translates the vocabulary.
            </p>
          </div>

          <Block>
            <textarea
              className="w-full h-32 p-3.5 border border-gray-200 bg-gray-50 rounded-xl text-[16px] resize-none focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              placeholder="e.g. words separated by commas, a paragraph from a book, a list of verbs..."
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setTextError("");
              }}
            />
          </Block>

          {textError && (
            <Block>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{textError}</p>
              </div>
            </Block>
          )}

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

          {/* Review extracted words */}
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

      {/* ===== MANUAL ENTRY ===== */}
      {activeMethod === "manual" && (
        <>
          <div className="px-5 mb-1">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">Type Manually</h2>
            <p className="text-[13px] text-gray-400 leading-snug">
              Add a single word with its translation. Use this when you encounter a new word you want to remember.
            </p>
          </div>

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

      {/* Recently added (shown across all methods) */}
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

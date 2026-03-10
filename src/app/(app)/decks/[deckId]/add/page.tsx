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
import CoachMark from "@/components/ui/CoachMark";

interface ExtractedWord {
  word: string;
  translation: string;
  selected: boolean;
}

export default function AddWordsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [nativeLang, setNativeLang] = useState("en");
  const [targetLang, setTargetLang] = useState("");

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

  // Photo capture state (CAPT-04 to CAPT-07)
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

  // Active tab
  const [activeTab, setActiveTab] = useState<"manual" | "photo" | "text" | "topic">("manual");

  // Existing words in deck (for dedup)
  const [existingWords, setExistingWords] = useState<string[]>([]);

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

      // Get the target language from the deck's own environment (not the global active one)
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

  // Resize image client-side to avoid exceeding API body limits
  const compressImage = (file: File, maxDim = 1200): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down if needed
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

  // CAPT-04 to CAPT-07: Photo capture & Gemini Vision extraction
  const handlePhotoSelected = async (file: File) => {
    if (!targetLang) return;

    setPhotoProcessing(true);
    setPhotoProgress("Preparing image...");
    setPhotoWords([]);
    setPhotoError("");

    try {
      // Compress image to reasonable size for API upload
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
        setPhotoError("No word pairs found. Try a photo with a vocabulary table.");
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

  // Text extraction state
  const [textError, setTextError] = useState("");

  // CAPT-01: Text extraction via Groq LLM
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
      // Track newly added words to prevent future duplicates
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

  // Topic generation (predefined or custom)
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
        }),
      });
      const data = await res.json();
      if (data.error) {
        setTopicError(data.error);
      } else if (data.words && data.words.length > 0) {
        // Filter out words already in the deck (client-side safety net)
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

  return (
    <>
      <div className="px-5 pt-2 pb-2">
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

        <h1 className="text-2xl font-bold tracking-tight mb-4">Add Words</h1>

        <CoachMark id="add-words-tabs" className="mb-4">
          <p className="font-semibold text-[15px] mb-1">Multiple ways to add words</p>
          <p className="text-[13px] text-blue-100 leading-relaxed">
            Type them manually, snap a photo, paste text, or let AI generate words by topic. Switch between methods using the tabs below.
          </p>
        </CoachMark>

        {/* Tab selector */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-1">
          {(["manual", "photo", "text", "topic"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-2 rounded-lg text-[12px] font-semibold ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {tab === "manual" ? "Manual" : tab === "photo" ? "Photo" : tab === "text" ? "Text" : "Topics"}
            </button>
          ))}
        </div>
      </div>

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

      {/* Photo Capture (CAPT-04 to CAPT-07) */}
      {activeTab === "photo" && (
        <>
          {photoWords.length === 0 ? (
            <>
              <Block className="text-center">
                <p className="text-gray-500 text-sm mb-4">
                  Take a photo of a vocabulary table from a book or document.
                  The app will extract words and translations automatically.
                </p>

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
                        Camera
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

      {/* Text Extraction (CAPT-01) */}
      {activeTab === "text" && (
        <>
          <Block>
            <p className="text-gray-500 text-sm mb-3">
              Paste any text — a word list, a paragraph, or even sentences. AI will extract vocabulary and translate it for you.
            </p>
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
              {/* Custom topic input */}
              <Block>
                <p className="text-gray-500 text-sm mb-3">
                  Describe a topic and AI will generate vocabulary for you.
                </p>
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

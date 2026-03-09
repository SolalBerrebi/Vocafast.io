"use client";

import { useState, useEffect, useRef } from "react";
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
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [topicWords, setTopicWords] = useState<ExtractedWord[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState<"manual" | "photo" | "text" | "topic">("manual");

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
    if (!activeEnvironment) return;

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
          targetLang: activeEnvironment.target_lang,
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
      setPhotoWords([]);
      setPhotoPreview(null);
    }
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

  const toggleWord = (index: number, list: "extracted" | "topic" | "photo") => {
    const setter = list === "extracted" ? setExtracted : list === "topic" ? setTopicWords : setPhotoWords;
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
        {(["manual", "photo", "text", "topic"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-black shadow-sm"
                : "text-gray-500"
            }`}
          >
            {tab === "manual" ? "Manual" : tab === "photo" ? "Photo" : tab === "text" ? "Text" : "Topics"}
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

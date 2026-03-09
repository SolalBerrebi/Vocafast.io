"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const METHODS = [
  {
    key: "manual",
    icon: "✏️",
    title: "Manual Entry",
    color: "blue",
    summary: "Type each word and its translation yourself",
    details: [
      "Enter the word in the target language",
      "Add the translation in your native language",
      "Optionally add a context sentence",
      "Best for: words you encounter during the day",
    ],
    visual: (
      <div className="space-y-2">
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
          <p className="text-[11px] text-gray-400 mb-0.5">Word</p>
          <p className="text-[14px] text-gray-800 font-medium">Bonjour</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
          <p className="text-[11px] text-gray-400 mb-0.5">Translation</p>
          <p className="text-[14px] text-gray-800 font-medium">Hello</p>
        </div>
      </div>
    ),
  },
  {
    key: "photo",
    icon: "📷",
    title: "Photo Scan",
    color: "purple",
    summary: "Take a photo and let AI extract the words",
    details: [
      "Snap a photo of a menu, sign, or textbook",
      "AI detects text and translates automatically",
      "Review and select the words you want to keep",
      "Best for: real-world immersion learning",
    ],
    visual: (
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-purple-700">AI Vision</p>
          <p className="text-[11px] text-purple-500">Reads text from images</p>
        </div>
      </div>
    ),
  },
  {
    key: "text",
    icon: "📋",
    title: "Paste Text",
    color: "green",
    summary: "Paste any text and AI extracts vocabulary",
    details: [
      "Copy text from an article, email, or book",
      "AI identifies useful vocabulary words",
      "Each word is auto-translated for you",
      "Best for: learning from content you read",
    ],
    visual: (
      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          <p className="text-[12px] font-semibold text-green-600">Pasted text</p>
        </div>
        <p className="text-[12px] text-green-700 leading-relaxed italic">
          &quot;Le chat dort sur le canapé pendant que...&quot;
        </p>
      </div>
    ),
  },
  {
    key: "topic",
    icon: "🤖",
    title: "AI Topics",
    color: "orange",
    summary: "AI generates words by topic automatically",
    details: [
      "Choose a topic like \"Food\", \"Travel\", or \"Business\"",
      "Or type any custom topic you can think of",
      "Choose how many words to generate (5-50)",
      "Best for: building vocabulary fast on a subject",
    ],
    visual: (
      <div className="flex flex-wrap gap-2">
        {["🍕 Food", "✈️ Travel", "💼 Business", "🏥 Health", "🎵 Music"].map((t) => (
          <span
            key={t}
            className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[12px] font-medium text-orange-700"
          >
            {t}
          </span>
        ))}
      </div>
    ),
  },
];

const COLORS: Record<string, { bg: string; border: string; activeBg: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", activeBg: "bg-blue-100" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", activeBg: "bg-purple-100" },
  green: { bg: "bg-green-50", border: "border-green-200", activeBg: "bg-green-100" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", activeBg: "bg-orange-100" },
};

export default function AddWordsTutorialPage() {
  const router = useRouter();
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  const handleDone = () => {
    localStorage.setItem("vocafast-tutorial-done", "1");
    router.push("/decks");
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-safe-top pb-safe-bottom">
      {/* Skip */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleDone}
          className="text-gray-400 text-[15px] font-medium py-1 px-2"
        >
          Skip
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mt-2 mb-8 px-4">
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col"
      >
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-[22px] bg-green-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Adding Vocabulary
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed">
            4 powerful ways to fill your decks with words
          </p>
        </div>

        {/* Methods */}
        <div className="space-y-3 mb-6">
          {METHODS.map((method, i) => {
            const isExpanded = expandedMethod === method.key;
            const colors = COLORS[method.color];

            return (
              <motion.div
                key={method.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
              >
                <button
                  onClick={() => setExpandedMethod(isExpanded ? null : method.key)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isExpanded
                      ? `${colors.activeBg} ${colors.border}`
                      : `bg-white border-gray-100 active:bg-gray-50`
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-gray-800">{method.title}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">{method.summary}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`mt-1 rounded-2xl ${colors.bg} border ${colors.border} p-4`}>
                        <ul className="space-y-2 mb-4">
                          {method.details.map((detail, j) => (
                            <li key={j} className="flex items-start gap-2.5">
                              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              <span className="text-[13px] text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                        {method.visual}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Tip */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-[13px] text-blue-700 leading-relaxed">
              <span className="font-semibold">Pro tip:</span> Mix different methods! Use AI Topics to build a base, then add specific words manually as you encounter them in real life.
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-[16px] active:scale-[0.98] transition-transform"
          >
            Back
          </button>
          <button
            onClick={handleDone}
            className="flex-[2] py-3.5 rounded-2xl bg-green-500 text-white font-semibold text-[16px] active:scale-[0.98] transition-transform shadow-lg shadow-green-500/25"
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const STEPS = [
  {
    number: "1",
    title: "Go to the Decks tab",
    desc: "Your decks live on the main screen. Tap the + button to create a new one.",
    visual: (
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      </div>
    ),
  },
  {
    number: "2",
    title: "Name your deck",
    desc: "Give it a meaningful name like \"Spanish Travel\" or \"Japanese Food\".",
    visual: (
      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
        <p className="text-[15px] text-gray-800 font-medium">Spanish Travel</p>
      </div>
    ),
  },
  {
    number: "3",
    title: "Pick a color & icon",
    desc: "Personalize your deck so it's easy to spot at a glance.",
    visual: (
      <div className="flex items-center gap-2">
        {["#007AFF", "#FF9500", "#FF3B30", "#34C759", "#5856D6"].map((c) => (
          <div
            key={c}
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    ),
  },
  {
    number: "4",
    title: "Start adding words!",
    desc: "Once created, you can fill your deck with vocabulary using multiple methods.",
    visual: (
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">📚</span>
        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="text-2xl">🎓</span>
      </div>
    ),
  },
];

export default function CreateDeckTutorialPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col px-6 pt-safe-top pb-safe-bottom">
      {/* Skip */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            localStorage.setItem("vocafast-tutorial-done", "1");
            router.push("/decks");
          }}
          className="text-gray-400 text-[15px] font-medium py-1 px-2"
        >
          Skip
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mt-2 mb-8 px-4">
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-gray-200" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col"
      >
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[22px] bg-orange-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">📂</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Creating a Deck
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed">
            Decks organize your vocabulary by theme or topic
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-[13px]">{step.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-gray-800">{step.title}</p>
                  <p className="text-[13px] text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  <div className="mt-3">{step.visual}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tip */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-[13px] text-blue-700 leading-relaxed">
              <span className="font-semibold">Pro tip:</span> Create separate decks for different contexts — one for travel, another for work, etc. This helps you study exactly what you need.
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
            onClick={() => router.push("/tutorial/add-words")}
            className="flex-[2] py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-[16px] active:scale-[0.98] transition-transform"
          >
            Next
          </button>
        </div>
      </motion.div>
    </div>
  );
}

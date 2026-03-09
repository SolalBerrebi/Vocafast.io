"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "@/types/database";

export type AnswerQuality = "again" | "hard" | "good";

interface FlashCardProps {
  word: Word;
  onAnswer: (quality: AnswerQuality) => void;
}

export default function FlashCard({ word, onAnswer }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setIsLeaving(false);
  }, [word.id]);

  const handleFlip = () => {
    if (!isFlipped && !isLeaving) setIsFlipped(true);
  };

  const handleAnswer = (quality: AnswerQuality) => {
    setIsLeaving(true);
    setTimeout(() => onAnswer(quality), 200);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={word.id}
          initial={{ opacity: 0, scale: 0.95, x: 40 }}
          animate={{ opacity: isLeaving ? 0 : 1, scale: isLeaving ? 0.95 : 1, x: isLeaving ? -40 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Card */}
          <div
            className="relative w-full h-64 cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={handleFlip}
          >
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.45, type: "spring", stiffness: 300, damping: 30 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 bg-white rounded-3xl flex flex-col items-center justify-center p-6 border border-gray-100"
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="text-[13px] text-gray-400 mb-3 font-medium">Translate this word</p>
                <p className="text-3xl font-bold text-center tracking-tight">{word.word}</p>
                {word.context_sentence && (
                  <p className="text-[13px] text-gray-400 mt-4 text-center italic leading-relaxed">
                    {word.context_sentence}
                  </p>
                )}
                <p className="text-[13px] text-gray-300 mt-6">Tap to reveal</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-blue-50 rounded-3xl flex flex-col items-center justify-center p-6 border border-blue-100"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-[13px] text-blue-400 mb-3 font-medium">Translation</p>
                <p className="text-3xl font-bold text-center text-blue-600 tracking-tight">
                  {word.translation}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Rating buttons */}
          {isFlipped && !isLeaving && (
            <motion.div
              className="flex gap-2.5 mt-8 justify-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <button
                onClick={() => handleAnswer("again")}
                className="flex-1 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-center active:scale-95 transition-all"
              >
                <span className="block text-lg leading-none">✕</span>
                <span className="block text-[11px] font-semibold text-red-600 mt-1">Again</span>
              </button>
              <button
                onClick={() => handleAnswer("hard")}
                className="flex-1 py-3.5 rounded-2xl bg-orange-50 border border-orange-100 text-center active:scale-95 transition-all"
              >
                <span className="block text-lg leading-none">~</span>
                <span className="block text-[11px] font-semibold text-orange-600 mt-1">Hard</span>
              </button>
              <button
                onClick={() => handleAnswer("good")}
                className="flex-1 py-3.5 rounded-2xl bg-green-50 border border-green-100 text-center active:scale-95 transition-all"
              >
                <span className="block text-lg leading-none">✓</span>
                <span className="block text-[11px] font-semibold text-green-600 mt-1">Good</span>
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

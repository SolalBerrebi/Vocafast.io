"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Word } from "@/types/database";

interface FlashCardProps {
  word: Word;
  onAnswer: (correct: boolean) => void;
}

export default function FlashCard({ word, onAnswer }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div
        className="relative w-full max-w-sm h-64 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-3xl shadow-lg flex flex-col items-center justify-center p-6 border border-gray-100"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-sm text-gray-400 mb-2">Translate this word</p>
            <p className="text-3xl font-bold text-center">{word.word}</p>
            <p className="text-sm text-gray-400 mt-6">Tap to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-blue-50 rounded-3xl shadow-lg flex flex-col items-center justify-center p-6 border border-blue-100"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-sm text-blue-400 mb-2">Translation</p>
            <p className="text-3xl font-bold text-center text-blue-600">
              {word.translation}
            </p>
          </div>
        </motion.div>
      </div>

      {isFlipped && (
        <motion.div
          className="flex gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => onAnswer(false)}
            className="px-8 py-3 rounded-full bg-red-50 text-red-600 font-semibold active:scale-95 transition-transform"
          >
            Incorrect
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="px-8 py-3 rounded-full bg-green-50 text-green-600 font-semibold active:scale-95 transition-transform"
          >
            Correct
          </button>
        </motion.div>
      )}
    </div>
  );
}

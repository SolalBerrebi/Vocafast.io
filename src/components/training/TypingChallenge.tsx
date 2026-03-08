"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Word } from "@/types/database";
import { isFuzzyMatch } from "@/lib/srs/engine";

interface TypingChallengeProps {
  word: Word;
  onAnswer: (correct: boolean) => void;
}

export default function TypingChallenge({
  word,
  onAnswer,
}: TypingChallengeProps) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitted) return;

    const correct = isFuzzyMatch(input, word.translation);
    setIsCorrect(correct);
    setSubmitted(true);

    setTimeout(() => onAnswer(correct), 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-400 text-center mb-2">
          Type the translation
        </p>
        <p className="text-3xl font-bold text-center mb-10">{word.word}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Type translation..."
            autoFocus
            className={`w-full p-4 rounded-2xl border-2 text-center text-lg font-medium outline-none transition-colors ${
              submitted
                ? isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
                : "border-gray-200 focus:border-blue-400"
            }`}
          />

          {!submitted && (
            <motion.button
              type="submit"
              disabled={!input.trim()}
              className="w-full mt-4 p-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-50"
              whileTap={{ scale: 0.97 }}
            >
              Check
            </motion.button>
          )}
        </form>

        {submitted && !isCorrect && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4 text-gray-600"
          >
            Correct answer:{" "}
            <span className="font-bold text-green-600">
              {word.translation}
            </span>
          </motion.p>
        )}
      </div>
    </div>
  );
}

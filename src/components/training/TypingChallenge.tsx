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

    setTimeout(() => onAnswer(correct), 800);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-400 text-center mb-2 font-medium">
          Type the translation
        </p>
        <p className="text-3xl font-bold text-center mb-3 tracking-tight">{word.word}</p>
        {word.context_sentence && (
          <p className="text-sm text-gray-400 text-center mb-8 italic">
            {word.context_sentence}
          </p>
        )}
        {!word.context_sentence && <div className="mb-8" />}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Type translation..."
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`w-full px-5 py-4 rounded-2xl border-2 text-center text-lg font-medium outline-none transition-all text-[16px] ${
              submitted
                ? isCorrect
                  ? "border-green-400 bg-green-50 shadow-sm shadow-green-100"
                  : "border-red-400 bg-red-50 shadow-sm shadow-red-100"
                : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white"
            }`}
          />

          {!submitted && (
            <motion.button
              type="submit"
              disabled={!input.trim()}
              className="w-full mt-4 py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-40 active:scale-[0.98] transition-all"
              whileTap={{ scale: 0.97 }}
            >
              Check
            </motion.button>
          )}
        </form>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center mt-5 py-3 px-4 rounded-xl ${
              isCorrect ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {isCorrect ? (
              <p className="text-green-600 font-semibold">Correct!</p>
            ) : (
              <p className="text-gray-600">
                Correct answer:{" "}
                <span className="font-bold text-green-600">
                  {word.translation}
                </span>
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

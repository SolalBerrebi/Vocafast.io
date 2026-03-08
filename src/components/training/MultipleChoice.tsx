"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Word } from "@/types/database";

interface MultipleChoiceProps {
  word: Word;
  options: string[];
  onAnswer: (correct: boolean) => void;
}

export default function MultipleChoice({
  word,
  options,
  onAnswer,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);

    const isCorrect = option === word.translation;
    setTimeout(() => onAnswer(isCorrect), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-400 text-center mb-2">
          What does this mean?
        </p>
        <p className="text-3xl font-bold text-center mb-10">{word.word}</p>

        <div className="space-y-3">
          {options.map((option, i) => {
            let bgClass = "bg-white border-gray-200";
            if (answered) {
              if (option === word.translation) {
                bgClass = "bg-green-50 border-green-400";
              } else if (option === selected) {
                bgClass = "bg-red-50 border-red-400";
              }
            } else if (option === selected) {
              bgClass = "bg-blue-50 border-blue-400";
            }

            return (
              <motion.button
                key={i}
                onClick={() => handleSelect(option)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-colors ${bgClass}`}
                whileTap={!answered ? { scale: 0.97 } : undefined}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

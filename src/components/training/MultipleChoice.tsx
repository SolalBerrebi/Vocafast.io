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
    setTimeout(() => onAnswer(isCorrect), 600);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-400 text-center mb-2 font-medium">
          What does this mean?
        </p>
        <p className="text-3xl font-bold text-center mb-3 tracking-tight">{word.word}</p>
        {word.context_sentence && (
          <p className="text-sm text-gray-400 text-center mb-8 italic">
            {word.context_sentence}
          </p>
        )}
        {!word.context_sentence && <div className="mb-8" />}

        <div className="space-y-2.5">
          {options.map((option, i) => {
            let classes = "bg-white border-gray-200";
            if (answered) {
              if (option === word.translation) {
                classes = "bg-green-50 border-green-400 shadow-sm shadow-green-100";
              } else if (option === selected) {
                classes = "bg-red-50 border-red-400 shadow-sm shadow-red-100";
              } else {
                classes = "bg-white border-gray-100 opacity-50";
              }
            } else if (option === selected) {
              classes = "bg-blue-50 border-blue-400";
            }

            return (
              <motion.button
                key={i}
                onClick={() => handleSelect(option)}
                className={`w-full px-5 py-4 rounded-2xl border-2 text-left font-medium text-[15px] transition-all ${classes}`}
                whileTap={!answered ? { scale: 0.97 } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{option}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

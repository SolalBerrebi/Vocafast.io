"use client";

import { motion } from "framer-motion";

interface SessionSummaryProps {
  correct: number;
  hard: number;
  incorrect: number;
  duration: number; // ms
  onDone: () => void;
}

export default function SessionSummary({
  correct,
  hard,
  incorrect,
  duration,
  onDone,
}: SessionSummaryProps) {
  const total = correct + hard + incorrect;
  const accuracy = total > 0 ? Math.round(((correct + hard) / total) * 100) : 0;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  let emoji = "🎉";
  let message = "Perfect!";
  if (accuracy < 50) {
    emoji = "💪";
    message = "Keep practicing!";
  } else if (accuracy < 80) {
    emoji = "👍";
    message = "Good job!";
  } else if (accuracy < 100) {
    emoji = "🔥";
    message = "Almost perfect!";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-7xl mb-4"
      >
        {emoji}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold mb-2 tracking-tight"
      >
        {message}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-sm mb-8"
      >
        {minutes > 0 ? `${minutes}m ` : ""}
        {seconds}s
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-4 gap-3 mb-10 w-full max-w-sm"
      >
        <div className="bg-green-50 rounded-2xl py-4 text-center">
          <p className="text-2xl font-bold text-green-600">{correct}</p>
          <p className="text-[11px] text-green-500 font-medium mt-0.5">Good</p>
        </div>
        <div className="bg-orange-50 rounded-2xl py-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{hard}</p>
          <p className="text-[11px] text-orange-500 font-medium mt-0.5">Hard</p>
        </div>
        <div className="bg-red-50 rounded-2xl py-4 text-center">
          <p className="text-2xl font-bold text-red-600">{incorrect}</p>
          <p className="text-[11px] text-red-500 font-medium mt-0.5">Again</p>
        </div>
        <div className="bg-gray-50 rounded-2xl py-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{accuracy}%</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Score</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-[16px] active:scale-[0.98] transition-all"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}

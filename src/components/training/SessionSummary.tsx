"use client";

import { motion } from "framer-motion";
import { Button, Block } from "konsta/react";

interface SessionSummaryProps {
  correct: number;
  incorrect: number;
  duration: number; // ms
  onDone: () => void;
}

export default function SessionSummary({
  correct,
  incorrect,
  duration,
  onDone,
}: SessionSummaryProps) {
  const total = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
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
        className="text-2xl font-bold mb-6"
      >
        {message}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-6 mb-10"
      >
        <div className="text-center">
          <p className="text-3xl font-bold text-green-500">{correct}</p>
          <p className="text-sm text-gray-500">Correct</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-500">{incorrect}</p>
          <p className="text-sm text-gray-500">Incorrect</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{accuracy}%</p>
          <p className="text-sm text-gray-500">Accuracy</p>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-sm mb-8"
      >
        {minutes > 0 ? `${minutes}m ` : ""}
        {seconds}s
      </motion.p>

      <Block className="w-full max-w-sm">
        <Button large onClick={onDone}>
          Done
        </Button>
      </Block>
    </div>
  );
}

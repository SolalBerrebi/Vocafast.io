"use client";

import { motion } from "framer-motion";

interface SessionSummaryProps {
  correct: number;
  hard: number;
  incorrect: number;
  duration: number; // ms
  avgResponseTime: number; // ms
  xpEarned: number;
  xpBase: number;
  xpSpeedBonus: number;
  xpStreakMultiplier: number;
  leveledUp: boolean;
  newLevelEmoji: string | null;
  newLevelName: string | null;
  onDone: () => void;
}

export default function SessionSummary({
  correct,
  hard,
  incorrect,
  duration,
  avgResponseTime,
  xpEarned,
  xpSpeedBonus,
  xpStreakMultiplier,
  leveledUp,
  newLevelEmoji,
  newLevelName,
  onDone,
}: SessionSummaryProps) {
  const total = correct + hard + incorrect;
  const accuracy = total > 0 ? Math.round(((correct + hard) / total) * 100) : 0;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  const avgSec = (avgResponseTime / 1000).toFixed(1);

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
      {/* Level-up celebration */}
      {leveledUp && newLevelEmoji ? (
        <>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="text-7xl mb-2"
          >
            {newLevelEmoji}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-1 tracking-tight"
          >
            Level Up!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm mb-6"
          >
            You are now <span className="font-semibold text-amber-600">{newLevelName}</span>
          </motion.p>
        </>
      ) : (
        <>
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
        </>
      )}

      {/* XP earned badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full px-4 py-2 mb-6"
      >
        <span className="text-lg font-bold text-amber-600">+{xpEarned} XP</span>
        {xpSpeedBonus > 0 && (
          <span className="text-[11px] text-orange-500 font-semibold bg-orange-100 px-1.5 py-0.5 rounded-full">
            Speed +{xpSpeedBonus}
          </span>
        )}
        {xpStreakMultiplier > 1 && (
          <span className="text-[11px] text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">
            x{xpStreakMultiplier}
          </span>
        )}
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-5 gap-2 mb-8 w-full max-w-sm"
      >
        <div className="bg-green-50 rounded-2xl py-3 text-center">
          <p className="text-xl font-bold text-green-600">{correct}</p>
          <p className="text-[10px] text-green-500 font-medium mt-0.5">Good</p>
        </div>
        <div className="bg-orange-50 rounded-2xl py-3 text-center">
          <p className="text-xl font-bold text-orange-600">{hard}</p>
          <p className="text-[10px] text-orange-500 font-medium mt-0.5">Hard</p>
        </div>
        <div className="bg-red-50 rounded-2xl py-3 text-center">
          <p className="text-xl font-bold text-red-600">{incorrect}</p>
          <p className="text-[10px] text-red-500 font-medium mt-0.5">Again</p>
        </div>
        <div className="bg-gray-50 rounded-2xl py-3 text-center">
          <p className="text-xl font-bold text-gray-800">{accuracy}%</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Score</p>
        </div>
        <div className="bg-blue-50 rounded-2xl py-3 text-center">
          <p className="text-xl font-bold text-blue-600">{avgSec}s</p>
          <p className="text-[10px] text-blue-500 font-medium mt-0.5">Speed</p>
        </div>
      </motion.div>

      {/* Duration */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-[13px] mb-8"
      >
        {minutes > 0 ? `${minutes}m ` : ""}
        {seconds}s total
      </motion.p>

      {/* Done button */}
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

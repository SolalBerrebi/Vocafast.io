"use client";

import { useGamificationStore } from "@/stores/gamification-store";
import {
  getLevelForXP,
  getNextLevel,
  getXPProgress,
  getXPToNextLevel,
} from "@/lib/gamification/levels";

export default function XpPill() {
  const totalXp = useGamificationStore((s) => s.totalXp);

  const currentLevel = getLevelForXP(totalXp);
  const nextLevel = getNextLevel(totalXp);
  const progress = getXPProgress(totalXp);
  const xpToNext = getXPToNextLevel(totalXp);

  return (
    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full pl-1.5 pr-2.5 py-1 min-w-0">
      {/* Current level emoji */}
      <span className="text-[16px] leading-none">{currentLevel.emoji}</span>

      <div className="flex flex-col min-w-0">
        {/* XP count */}
        <span className="text-[11px] font-bold text-amber-700 leading-tight tabular-nums">
          {totalXp.toLocaleString()} XP
        </span>

        {/* Progress bar + next level shadow */}
        {nextLevel && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-10 h-[3px] bg-amber-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Next level emoji as shadow/silhouette */}
            <span
              className="text-[10px] leading-none select-none"
              style={{
                filter: "brightness(0) opacity(0.2)",
              }}
              title={`${xpToNext} XP to ${nextLevel.name}`}
            >
              {nextLevel.emoji}
            </span>
          </div>
        )}

        {/* Max level indicator */}
        {!nextLevel && (
          <span className="text-[9px] text-amber-500 font-medium leading-tight">
            MAX
          </span>
        )}
      </div>
    </div>
  );
}

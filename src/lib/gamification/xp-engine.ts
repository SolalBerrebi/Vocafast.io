export interface SessionXPResult {
  baseXP: number;
  speedBonus: number;
  streakMultiplier: number;
  completionBonus: number;
  totalXP: number;
}

export function calculateSessionXP(params: {
  correct: number;
  hard: number;
  incorrect: number;
  avgResponseTimeMs: number;
  streakDays: number;
}): SessionXPResult {
  // Base XP per answer type
  const baseXP = params.correct * 10 + params.hard * 5 + params.incorrect * 2;

  // Speed bonus: up to 50% extra for fast answers (< 5s avg)
  let speedMultiplier = 1.0;
  if (params.avgResponseTimeMs > 0 && params.avgResponseTimeMs < 5000) {
    speedMultiplier = 1.0 + (5000 - params.avgResponseTimeMs) / 10000;
  }
  const speedBonus = Math.round(baseXP * (speedMultiplier - 1));

  // Streak multiplier
  let streakMultiplier = 1.0;
  if (params.streakDays >= 7) streakMultiplier = 1.5;
  else if (params.streakDays >= 4) streakMultiplier = 1.2;
  else if (params.streakDays >= 2) streakMultiplier = 1.1;

  // Flat completion bonus
  const completionBonus = 20;

  const totalXP = Math.round(
    (baseXP + speedBonus + completionBonus) * streakMultiplier,
  );

  return { baseXP, speedBonus, streakMultiplier, completionBonus, totalXP };
}

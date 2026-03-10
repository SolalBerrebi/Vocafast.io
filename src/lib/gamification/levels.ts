export interface Level {
  level: number;
  emoji: string;
  name: string;
  xpRequired: number;
}

// Mystical Journey progression — each level reveals a new artifact
export const LEVELS: Level[] = [
  { level: 1, emoji: "🌱", name: "Sprout", xpRequired: 0 },
  { level: 2, emoji: "🕯️", name: "Flame Keeper", xpRequired: 50 },
  { level: 3, emoji: "📿", name: "Apprentice", xpRequired: 150 },
  { level: 4, emoji: "🔮", name: "Seer", xpRequired: 350 },
  { level: 5, emoji: "🧪", name: "Alchemist", xpRequired: 650 },
  { level: 6, emoji: "📜", name: "Scholar", xpRequired: 1100 },
  { level: 7, emoji: "🗝️", name: "Key Master", xpRequired: 1800 },
  { level: 8, emoji: "🪄", name: "Enchanter", xpRequired: 2800 },
  { level: 9, emoji: "🧿", name: "Oracle", xpRequired: 4200 },
  { level: 10, emoji: "⚗️", name: "Sage", xpRequired: 6000 },
  { level: 11, emoji: "🔱", name: "Sovereign", xpRequired: 8500 },
  { level: 12, emoji: "⚡", name: "Storm Caller", xpRequired: 11500 },
  { level: 13, emoji: "💎", name: "Crystal Lord", xpRequired: 15000 },
  { level: 14, emoji: "🌋", name: "Titan", xpRequired: 20000 },
  { level: 15, emoji: "🐉", name: "Dragon Rider", xpRequired: 27000 },
  { level: 16, emoji: "👑", name: "Eternal", xpRequired: 36000 },
];

export function getLevelForXP(totalXp: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.xpRequired) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getNextLevel(totalXp: number): Level | null {
  const current = getLevelForXP(totalXp);
  const next = LEVELS.find((l) => l.level === current.level + 1);
  return next ?? null;
}

/** Returns 0-100 progress percentage toward next level */
export function getXPProgress(totalXp: number): number {
  const current = getLevelForXP(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 100; // Max level
  const range = next.xpRequired - current.xpRequired;
  const progress = totalXp - current.xpRequired;
  return Math.min(100, Math.round((progress / range) * 100));
}

/** Returns XP remaining until next level */
export function getXPToNextLevel(totalXp: number): number {
  const next = getNextLevel(totalXp);
  if (!next) return 0;
  return next.xpRequired - totalXp;
}

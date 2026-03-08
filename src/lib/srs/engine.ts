/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but upon seeing correct answer, remembered
 * 2 - Incorrect, but correct answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect response
 */

export interface SRSResult {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReviewAt: Date;
}

export function calculateSRS(
  quality: number,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number,
): SRSResult {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let easeFactor = currentEaseFactor;
  let interval: number;
  let repetitions: number;

  if (q < 3) {
    // Failed — reset repetitions
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    repetitions = currentRepetitions + 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
  }

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Minimum ease factor of 1.3
  easeFactor = Math.max(1.3, easeFactor);

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewAt,
  };
}

/**
 * Determine quality rating from user interaction
 */
export function qualityFromCorrectness(
  wasCorrect: boolean,
  responseTimeMs?: number,
): number {
  if (!wasCorrect) return 1;

  // If we have response time, use it to differentiate 3-5
  if (responseTimeMs !== undefined) {
    if (responseTimeMs < 2000) return 5; // Quick and correct
    if (responseTimeMs < 5000) return 4; // Correct after thinking
    return 3; // Correct but slow
  }

  return 4; // Default correct quality
}

/**
 * Levenshtein distance for fuzzy matching in typing mode
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if typed answer is close enough (Levenshtein distance <= 2)
 */
export function isFuzzyMatch(typed: string, correct: string): boolean {
  const a = typed.toLowerCase().trim();
  const b = correct.toLowerCase().trim();
  if (a === b) return true;
  return levenshteinDistance(a, b) <= 2;
}

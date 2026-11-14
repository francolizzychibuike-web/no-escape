/**
 * NO ESCAPE - Core Game Rules and Pure Logic
 * Decoupled from React and Three.js for fast deterministic testing
 */

import { Difficulty, LevelProgress } from './types';

export const CHAPTER_NAMES = [
  'THE BEGINNING',
  'THE TRAP HOUSE',
  'THE FORGOTTEN CITY',
  'NIGHTMARE WORLD',
  'NO ESCAPE',
];

export const DIFFICULTY_MODIFIERS: Record<
  Difficulty,
  {
    damageMultiplier: number;
    staminaDrain: number;
    enemySpeedMultiplier: number;
    flashlightDrain: number;
    coyoteTime: number;
  }
> = {
  easy: {
    damageMultiplier: 0.6,
    staminaDrain: 0.7,
    enemySpeedMultiplier: 0.8,
    flashlightDrain: 0.5,
    coyoteTime: 0.16,
  },
  normal: {
    damageMultiplier: 1.0,
    staminaDrain: 1.0,
    enemySpeedMultiplier: 1.0,
    flashlightDrain: 1.0,
    coyoteTime: 0.12,
  },
  hard: {
    damageMultiplier: 1.5,
    staminaDrain: 1.3,
    enemySpeedMultiplier: 1.25,
    flashlightDrain: 1.4,
    coyoteTime: 0.08,
  },
  nightmare: {
    damageMultiplier: 2.5,
    staminaDrain: 1.8,
    enemySpeedMultiplier: 1.5,
    flashlightDrain: 2.0,
    coyoteTime: 0.05,
  },
};

/**
 * Calculates 1, 2, or 3 stars based on completion time and death count
 */
export function calculateStars(
  timeSeconds: number,
  parTime: number,
  deaths: number,
  difficulty: Difficulty
): number {
  if (difficulty === 'nightmare') {
    // Nightmare reward: Any win is impressive
    if (deaths === 0) return 3;
    if (deaths <= 3) return 2;
    return 1;
  }

  // 3 stars: 0 deaths and within 130% par time
  if (deaths === 0 && timeSeconds <= parTime * 1.3) {
    return 3;
  }
  // 2 stars: under 2 deaths and reasonable time
  if (deaths <= 2 && timeSeconds <= parTime * 2.0) {
    return 2;
  }
  return 1;
}

/**
 * Checks 3D AABB or spherical proximity between player and a trap trigger
 */
export function isPointInRadius(
  point: [number, number, number],
  center: [number, number, number],
  radius: number
): boolean {
  const dx = point[0] - center[0];
  const dy = point[1] - center[1];
  const dz = point[2] - center[2];
  return dx * dx + dy * dy + dz * dz <= radius * radius;
}

/**
 * Checks 3D Box collision (AABB)
 */
export function checkAABBCollision(
  pos1: [number, number, number],
  size1: [number, number, number],
  pos2: [number, number, number],
  size2: [number, number, number]
): boolean {
  return (
    Math.abs(pos1[0] - pos2[0]) * 2 < size1[0] + size2[0] &&
    Math.abs(pos1[1] - pos2[1]) * 2 < size1[1] + size2[1] &&
    Math.abs(pos1[2] - pos2[2]) * 2 < size1[2] + size2[2]
  );
}

/**
 * Resolves chapter number (1-5) from level ID (1-50)
 */
export function getChapterForLevel(levelId: number): number {
  if (levelId <= 10) return 1;
  if (levelId <= 20) return 2;
  if (levelId <= 30) return 3;
  if (levelId <= 40) return 4;
  return 5;
}

/**
 * Initial empty progress for all 50 levels
 */
export function getInitialProgress(): Record<number, LevelProgress> {
  const progress: Record<number, LevelProgress> = {};
  for (let i = 1; i <= 50; i++) {
    progress[i] = {
      unlocked: i === 1, // Level 1 starts unlocked
      stars: 0,
      bestTime: 0,
      deaths: 0,
      completed: false,
    };
  }
  return progress;
}

/**
 * Update level progress upon completing a level
 */
export function recordLevelCompletion(
  currentProgress: Record<number, LevelProgress>,
  levelId: number,
  timeSeconds: number,
  parTime: number,
  deaths: number,
  difficulty: Difficulty
): Record<number, LevelProgress> {
  const updated = { ...currentProgress };
  const stars = calculateStars(timeSeconds, parTime, deaths, difficulty);
  const prev = updated[levelId] || {
    unlocked: true,
    stars: 0,
    bestTime: 0,
    deaths: 0,
    completed: false,
  };

  updated[levelId] = {
    unlocked: true,
    stars: Math.max(prev.stars, stars),
    bestTime: prev.bestTime === 0 ? timeSeconds : Math.min(prev.bestTime, timeSeconds),
    deaths: prev.deaths + deaths,
    completed: true,
  };

  // Unlock next level up to 50
  if (levelId < 50) {
    updated[levelId + 1] = {
      ...updated[levelId + 1],
      unlocked: true,
    };
  }

  return updated;
}

/**
 * Troll hints / quotes displayed upon dying to hilarious deceptive traps
 */
export const TROLL_DEATH_QUOTES = [
  "Did you really trust that door?",
  "Rule #1 in NO ESCAPE: If it looks safe, run.",
  "That wasn't a floor, that was an illusion.",
  "The exit took one look at you and left.",
  "Checkpoints can lie too. Remember that.",
  "Level Devil warned you... you didn't listen.",
  "Gravity is merely a suggestion here.",
  "Watch your step. And your ceiling. And the walls.",
  "The creature heard you running. Stealth is survival.",
  "Patience is a virtue; greed will get you impaled.",
];

export function getRandomTrollQuote(): string {
  const idx = Math.floor(Math.random() * TROLL_DEATH_QUOTES.length);
  return TROLL_DEATH_QUOTES[idx];
}

import { describe, expect, it } from 'vitest';
import {
  compareBest,
  createShuffledNumbers,
  formatTime,
  isCorrectTap,
  isSolved,
  normalizeBest,
  parseBest,
  progressAfterTap,
  serializeBest,
  type BestScore,
  type Rng,
} from './engine';

const seeded = (values: number[]): Rng => {
  let index = 0;
  return () => values[index++ % values.length];
};

describe('schulte grid engine', () => {
  it('generates a playable 5x5 permutation with every number once', () => {
    const values = createShuffledNumbers(5, seeded([0.1, 0.7, 0.3, 0.9]));
    expect(values).toHaveLength(25);
    expect(new Set(values).size).toBe(25);
    expect(Math.min(...values)).toBe(1);
    expect(Math.max(...values)).toBe(25);
  });

  it('generates full permutations for all three sizes', () => {
    for (const size of [5, 6, 7] as const) {
      const values = createShuffledNumbers(size, () => 0.42);
      expect(values).toHaveLength(size * size);
      expect(new Set(values).size).toBe(size * size);
    }
  });

  it('accepts only the current target number', () => {
    expect(isCorrectTap(7, 7)).toBe(true);
    expect(isCorrectTap(8, 7)).toBe(false);
  });

  it('advances progress on a correct tap and holds on mistakes', () => {
    expect(progressAfterTap(4, 4)).toBe(5);
    expect(progressAfterTap(6, 4)).toBe(4);
  });

  it('detects completion only after the final number', () => {
    expect(isSolved(25, 5)).toBe(false);
    expect(isSolved(26, 5)).toBe(true);
    expect(isSolved(50, 7)).toBe(true);
  });

  it('prefers faster times as best score', () => {
    const slower: BestScore = { seconds: 40, mistakes: 0, finishedAt: 1 };
    const faster: BestScore = { seconds: 30, mistakes: 4, finishedAt: 2 };
    expect(compareBest(faster, slower)).toEqual(faster);
    expect(compareBest(slower, faster)).toEqual(faster);
  });

  it('breaks equal times by fewer mistakes', () => {
    const clean: BestScore = { seconds: 35.2, mistakes: 0, finishedAt: 1 };
    const messy: BestScore = { seconds: 35.2, mistakes: 3, finishedAt: 2 };
    expect(compareBest(clean, messy)).toEqual(clean);
    expect(compareBest(messy, clean)).toEqual(clean);
  });

  it('normalizes stored scores and rejects malformed payloads', () => {
    expect(normalizeBest({ seconds: 21.23456, mistakes: 1.9, finishedAt: 5 })).toEqual({ seconds: 21.235, mistakes: 1, finishedAt: 5 });
    expect(normalizeBest(null)).toBeNull();
    expect(normalizeBest({ seconds: 'bad' })).toBeNull();
  });

  it('round-trips best score JSON and ignores broken storage', () => {
    const best: BestScore = { seconds: 18.4, mistakes: 2, finishedAt: 8 };
    expect(parseBest(serializeBest(best))).toEqual(best);
    expect(parseBest('nope')).toBeNull();
    expect(parseBest(null)).toBeNull();
  });

  it('formats elapsed time with minutes, seconds and tenths', () => {
    expect(formatTime(0)).toBe('00:00.0');
    expect(formatTime(65.28)).toBe('01:05.2');
    expect(formatTime(600)).toBe('10:00.0');
  });
});

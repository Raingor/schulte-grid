export type GridSize = 5 | 6 | 7;
export type Rng = () => number;

export const GRID_SIZES: readonly GridSize[] = [5, 6, 7];
export const BEST_PREFIX = '{{SECRET_ebt8fnfy}}-';
export const SOUND_KEY = '{{SECRET_2wcg6apj}}';

export function createShuffledNumbers(size: GridSize, rng: Rng = Math.random): number[] {
  const count = size * size;
  const values = Array.from({ length: count }, (_, index) => index + 1);
  for (let index = count - 1; index > 0; index -= 1) {
    const raw = rng();
    const safe = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
    const swap = Math.floor(safe * (index + 1));
    [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values;
}

export function isSolved(progress: number, size: GridSize): boolean {
  return progress > size * size;
}

export function isCorrectTap(value: number, expected: number): boolean {
  return value === expected;
}

export function progressAfterTap(value: number, current: number): number {
  return isCorrectTap(value, current) ? current + 1 : current;
}

export interface BestScore {
  seconds: number;
  mistakes: number;
  finishedAt: number;
}

export function compareBest(next: BestScore, current: BestScore | null): BestScore {
  if (!current) return next;
  if (next.seconds < current.seconds) return next;
  if (next.seconds === current.seconds && next.mistakes < current.mistakes) return next;
  return current;
}

export function normalizeBest(value: unknown): BestScore | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const seconds = Number(record.seconds);
  const mistakes = Number(record.mistakes);
  const finishedAt = Number(record.finishedAt);
  if (!Number.isFinite(seconds) || !Number.isFinite(mistakes)) return null;
  return {
    seconds: Math.max(0, Math.round(seconds * 1000) / 1000),
    mistakes: Math.max(0, Math.floor(mistakes)),
    finishedAt: Number.isFinite(finishedAt) ? Math.floor(finishedAt) : 0,
  };
}

export function parseBest(raw: string | null): BestScore | null {
  if (!raw) return null;
  try {
    return normalizeBest(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function serializeBest(best: BestScore): string {
  return JSON.stringify(normalizeBest(best));
}

export function formatTime(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const minutes = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const tenths = Math.floor((totalMs % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

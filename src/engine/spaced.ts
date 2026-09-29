/**
 * Remember / spaced practice scheduler (Framework §3.5, §39).
 * Intervals are scheduling defaults, not developmental milestones.
 * No child-facing streaks.
 */
import type { Outcome, SpacedState } from './types';

export const INTERVALS: { key: string; label: string; hours: number }[] = [
  { key: 'sameSession', label: 'Same session', hours: 0 },
  { key: 'laterToday', label: 'Later today', hours: 4 },
  { key: 'nextSession', label: 'Next session', hours: 16 },
  { key: '1d', label: '1 day', hours: 24 },
  { key: '3d', label: '3 days', hours: 72 },
  { key: '7d', label: '7 days', hours: 168 },
  { key: '14d', label: '14 days', hours: 336 },
  { key: '30d', label: '30 days', hours: 720 },
];

export function nextIndex(index: number, outcome: Outcome): number {
  const max = INTERVALS.length - 1;
  switch (outcome) {
    case 'independent':
      return Math.min(max, index + 1);
    case 'supported':
      // maintain, or modestly lengthen while intervals are still short
      return index < 3 ? Math.min(max, index + 1) : index;
    case 'partial':
    case 'notDemonstrated':
      return Math.max(0, index - 1);
    case 'accessLimited':
    default:
      // reschedule at the same interval — not a regression
      return index;
  }
}

export function schedule(state: SpacedState, outcome: Outcome, now: Date = new Date()): SpacedState {
  const index = nextIndex(state.index, outcome);
  const hours = outcome === 'accessLimited' ? Math.min(INTERVALS[index].hours, 16) : INTERVALS[index].hours;
  return {
    index,
    lastAt: now.toISOString(),
    nextDue: new Date(now.getTime() + hours * 3600 * 1000).toISOString(),
  };
}

export function isDue(state: SpacedState, now: Date = new Date()): boolean {
  if (!state.nextDue) return true;
  return new Date(state.nextDue).getTime() <= now.getTime();
}

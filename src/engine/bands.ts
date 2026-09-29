/**
 * Presentation Bands (Framework Part VII). Bands describe how content is
 * presented — never a skill level — and adults can change them at any time.
 */
import type { PresentationBand } from './types';

export interface BandProfile {
  band: PresentationBand;
  name: string;
  summary: string;
  maxChoices: number;
  missionMinutes: [number, number];
  wordsPerButton: string;
  emphasis: string;
}

export const BANDS: Record<PresentationBand, BandProfile> = {
  A: {
    band: 'A',
    name: 'Icon-First Explorer',
    summary: 'Very low reading load, 1-step directions, 2–3 choices, strong visuals, model-first.',
    maxChoices: 2,
    missionMinutes: [2, 4],
    wordsPerButton: '1–3 words',
    emphasis: 'Notice · Copy · Together',
  },
  B: {
    band: 'B',
    name: 'Guided Explorer',
    summary: 'Short sentences, 2–4 step routines, 3–4 choices and simple cause-and-effect stories.',
    maxChoices: 4,
    missionMinutes: [3, 6],
    wordsPerButton: 'One short sentence',
    emphasis: 'Together · My Turn',
  },
  C: {
    band: 'C',
    name: 'Independent Explorer',
    summary: 'Longer stories, nuanced choices, independent navigation and more real-world planning.',
    maxChoices: 5,
    missionMinutes: [5, 8],
    wordsPerButton: 'Concise phrases',
    emphasis: 'Explore · Remember',
  },
};

/** Trim a choice list to the band's comfortable number, always keeping helpful options. */
export function choicesForBand<T extends { helpful?: boolean }>(options: T[], band: PresentationBand): T[] {
  const max = BANDS[band].maxChoices;
  if (options.length <= max) return options;
  const helpful = options.filter((o) => o.helpful);
  const other = options.filter((o) => !o.helpful);
  return [...helpful.slice(0, Math.max(1, max - 1)), ...other].slice(0, max);
}

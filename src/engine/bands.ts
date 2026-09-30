/**
 * Presentation Bands (Framework Part VII). Bands describe how content is
 * presented — never a skill level — and adults can change them at any time.
 */
import type { Modality, PresentationBand } from './types';

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
    maxChoices: 3,
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

/**
 * Trim a choice list to the band's comfortable number. Helpful options come
 * first, preferring the learner's own ways of responding and then non-speech
 * ones, so a trimmed list never demands speech. With room for three or more
 * a non-helpful option is kept, so the choice stays a real choice. Always
 * returns at least two options when two exist.
 */
export function choicesForBand<T extends { helpful?: boolean; modality?: Modality }>(options: T[], band: PresentationBand, preferred?: Modality[]): T[] {
  const max = BANDS[band].maxChoices;
  if (options.length <= max) return options;
  const rank = (o: T) => {
    const m = o.modality ?? 'tap';
    if (preferred?.includes(m) && m !== 'speech') return 0;
    if (m !== 'speech') return 1;
    return preferred?.includes('speech') ? 2 : 3;
  };
  const helpful = options.map((o, i) => ({ o, i })).filter(({ o }) => o.helpful).sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i).map(({ o }) => o);
  const other = options.filter((o) => !o.helpful);
  const picked = helpful.slice(0, max >= 3 ? max - 1 : max);
  if (max >= 3 && other.length) picked.push(other[0]);
  // Top up to the band size (and never below two) from what is left.
  for (const o of [...helpful, ...other]) {
    if (picked.length >= Math.max(Math.min(2, options.length), Math.min(max, options.length))) break;
    if (!picked.includes(o)) picked.push(o);
  }
  // Keep the authored order so the list reads naturally.
  return options.filter((o) => picked.includes(o));
}

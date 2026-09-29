/**
 * Prompt Engine — Support Ladder and fading rules (Framework Part V, §7, §26).
 * The goal is the least intrusive support that allows successful access —
 * not the removal of every support.
 */
import { isSuccess } from './evidence';
import type { AgencyTool, GrowthGoal, JourneyMode, Observation, PresentationBand, SupportLevel } from './types';

export const SUPPORT_LADDER: { level: SupportLevel; key: string; label: string; kid: string }[] = [
  { level: 1, key: 'independent', label: 'Independent', kid: 'My turn' },
  { level: 2, key: 'environmental', label: 'Environmental cue', kid: 'A little clue' },
  { level: 3, key: 'visual', label: 'Visual cue', kid: 'Picture hint' },
  { level: 4, key: 'gestural', label: 'Gestural cue', kid: 'Pointing hint' },
  { level: 5, key: 'model', label: 'Model', kid: 'Watch Finn' },
  { level: 6, key: 'verbal', label: 'Brief verbal guidance', kid: 'Talk it through' },
  { level: 7, key: 'adult', label: 'Adult-supported', kid: 'Together' },
];

/** Default in-app support for each child-facing journey mode. */
export function supportForMode(mode: JourneyMode, band: PresentationBand): SupportLevel {
  const base: Record<JourneyMode, SupportLevel> = { discover: 5, practice: 3, explore: 2, remember: 1 };
  const lvl = base[mode];
  // Icon-first presentation benefits from one extra visual step in Discover/Practice.
  if (band === 'A' && (mode === 'practice' || mode === 'explore')) return Math.min(7, lvl + 1) as SupportLevel;
  return lvl;
}

/** Participation mode shown to the child (Framework §11). */
export function participationFor(level: SupportLevel): 'notice' | 'copy' | 'together' | 'myTurn' {
  if (level >= 6) return 'together';
  if (level === 5) return 'notice';
  if (level >= 3) return 'copy';
  return 'myTurn';
}

export const HELP_TOOLS: AgencyTool[] = ['help', 'moreTime', 'notYet'];

export type SupportChange = {
  direction: 'reduce' | 'restore' | 'increase';
  from: SupportLevel;
  to: SupportLevel;
  reason: string;
};

const clampLevel = (n: number) => Math.max(1, Math.min(7, n)) as SupportLevel;

/**
 * Suggests one support change for a goal, honouring:
 * - fade after 3 successful valid opportunities at the current level (§13)
 * - restore after 2 consecutive misses following a fade, or a help request
 * - temporary increase for a new context (not regression)
 * - one meaningful change per 3 valid opportunities (§26)
 * - never fade protected accommodations (handled by caller: they are not on the ladder)
 */
export function suggestSupportChange(goal: GrowthGoal, observations: Observation[]): SupportChange | null {
  const valid = observations
    .filter((o) => o.quality === 'valid' && o.outcome !== 'accessLimited')
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  const all = [...observations].sort((a, b) => (a.at < b.at ? -1 : 1));
  const level = goal.supportLevel;
  const last = goal.adaptations[goal.adaptations.length - 1];
  const sinceLast = last ? valid.length - last.atValidCount : valid.length;

  // Restore after a fade that did not hold.
  if (last && last.kind === 'fade') {
    const after = valid.slice(last.atValidCount);
    const lastTwo = after.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every((o) => !isSuccess(o))) {
      return {
        direction: 'restore',
        from: level,
        to: clampLevel(Number(last.from ?? level + 1)),
        reason: 'Two tries in a row were harder after the hint was faded, so the earlier support comes back.',
      };
    }
  }

  const recent = all.slice(-3);
  const helpAsked = recent.some((o) => o.tools.some((t) => HELP_TOOLS.includes(t)));
  if (helpAsked && level < 7) {
    return {
      direction: 'increase',
      from: level,
      to: clampLevel(level + 1),
      reason: 'The learner asked for help or more time — support goes up for now. That is self-advocacy, not a setback.',
    };
  }

  const lastObs = all[all.length - 1];
  if (lastObs && lastObs.context.novelty === 'new' && level < 7) {
    return {
      direction: 'increase',
      from: level,
      to: clampLevel(level + 1),
      reason: 'A new place or person was introduced, so support is raised temporarily. This is not regression.',
    };
  }

  if (sinceLast < 3) return null; // adaptation rate limit

  const lastThree = valid.slice(-3);
  const accessIssues = all.slice(-3).filter((o) => o.quality === 'accessLimited' || o.outcome === 'accessLimited').length;
  if (
    level > 1 &&
    lastThree.length === 3 &&
    lastThree.every((o) => isSuccess(o) && o.supportLevel <= level) &&
    accessIssues === 0
  ) {
    return {
      direction: 'reduce',
      from: level,
      to: clampLevel(level - 1),
      reason: 'Three recent tries worked at this support level, so try one step lighter (context kept the same).',
    };
  }
  return null;
}

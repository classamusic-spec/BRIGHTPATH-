/**
 * Evidence Engine — turns opportunity events into honest, explainable
 * summaries (Framework Parts II, X). Access-limited and invalid events stay
 * visible but never count as skill failure.
 */
import type {
  Confidence,
  EvidenceSource,
  GrowthDimension,
  GrowthGoal,
  Observation,
  Outcome,
  OpportunityContext,
  SupportLevel,
} from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Recent window used for routing heuristics. */
export const RECENT_VALID = 12;

export function isSuccess(o: Pick<Observation, 'outcome'>): boolean {
  return o.outcome === 'independent' || o.outcome === 'supported';
}

/** Success at Independent / Environmental / Visual support (levels 1–3). */
export function isLowSupportSuccess(o: Pick<Observation, 'outcome' | 'supportLevel'>): boolean {
  return isSuccess(o) && o.supportLevel <= 3;
}

/** 0..1 score of how accessible the skill was in one opportunity. */
export function outcomeScore(o: Pick<Observation, 'outcome' | 'supportLevel'>): number {
  switch (o.outcome) {
    case 'independent':
      return 1;
    case 'supported':
      return o.supportLevel <= 3 ? 0.78 : o.supportLevel <= 5 ? 0.58 : 0.45;
    case 'partial':
      return 0.3;
    case 'notDemonstrated':
      return 0;
    default:
      return 0;
  }
}

export function contextKey(c: OpportunityContext): string {
  return c.setting;
}

export function sessionKey(o: Observation): string {
  return `${o.at.slice(0, 10)}|${o.source}`;
}

export function byTime(a: Observation, b: Observation) {
  return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface EvidenceSummary {
  all: Observation[];
  valid: Observation[];
  recentValid: Observation[];
  accessLimited: Observation[];
  invalid: Observation[];
  counts: Record<Outcome, number>;
  validCount: number;
  successCount: number;
  lowSupportSuccessCount: number;
  /** Success rate across recent valid opportunities. */
  successRate: number;
  /** Low-support (≤ visual cue) success rate across recent valid opportunities. */
  lowSupportRate: number;
  sessions: number;
  /** Contexts with usable evidence (≥ 2 valid opportunities). */
  contexts: string[];
  /** Contexts with reliable success (≥ 2 valid and ≥ 60% success). */
  reliableContexts: string[];
  sources: EvidenceSource[];
  typicalSupport: number;
  retention: { probes: number; successes: number };
  realWorld: { events: number; successes: number; independent: number; settings: string[] };
  fullDemonstrations: number;
  confidence: Confidence;
  lastAt?: string;
}

export function summarize(observations: Observation[]): EvidenceSummary {
  const all = [...observations].sort(byTime);
  const valid = all.filter((o) => o.quality === 'valid' && o.outcome !== 'accessLimited');
  const accessLimited = all.filter((o) => o.quality === 'accessLimited' || o.outcome === 'accessLimited');
  const invalid = all.filter((o) => o.quality === 'invalid');
  const recentValid = valid.slice(-RECENT_VALID);

  const counts: Record<Outcome, number> = {
    independent: 0,
    supported: 0,
    partial: 0,
    notDemonstrated: 0,
    accessLimited: accessLimited.length,
  };
  for (const o of valid) counts[o.outcome] += 1;

  const successCount = recentValid.filter(isSuccess).length;
  const lowSupportSuccessCount = recentValid.filter(isLowSupportSuccess).length;

  const ctx = new Map<string, Observation[]>();
  for (const o of valid) {
    const k = contextKey(o.context);
    ctx.set(k, [...(ctx.get(k) ?? []), o]);
  }
  const contexts = [...ctx.entries()].filter(([, v]) => v.length >= 2).map(([k]) => k);
  const reliableContexts = [...ctx.entries()]
    .filter(([, v]) => v.length >= 2 && v.filter(isSuccess).length / v.length >= 0.6)
    .map(([k]) => k);

  const sessions = new Set(valid.map(sessionKey)).size;
  const sources = [...new Set(valid.map((o) => o.source))];
  const successes = recentValid.filter(isSuccess);
  const typicalSupport = successes.length ? median(successes.map((o) => o.supportLevel)) : 7;

  const probes = valid.filter((o) => (o.delayDays ?? 0) >= 1);
  const rw = valid.filter((o) => o.realWorld);

  const fullDemonstrations = valid.filter((o) => isSuccess(o) && o.supportLevel <= 4).length;

  return {
    all,
    valid,
    recentValid,
    accessLimited,
    invalid,
    counts,
    validCount: valid.length,
    successCount,
    lowSupportSuccessCount,
    successRate: recentValid.length ? successCount / recentValid.length : 0,
    lowSupportRate: recentValid.length ? lowSupportSuccessCount / recentValid.length : 0,
    sessions,
    contexts,
    reliableContexts,
    sources,
    typicalSupport,
    retention: { probes: probes.length, successes: probes.filter(isSuccess).length },
    realWorld: {
      events: rw.length,
      successes: rw.filter(isSuccess).length,
      independent: rw.filter((o) => o.outcome === 'independent').length,
      settings: [...new Set(rw.filter(isSuccess).map((o) => o.context.setting))],
    },
    fullDemonstrations,
    confidence: confidenceOf(valid.length, new Set([...valid.map((o) => o.context.setting), ...valid.map((o) => o.source)]).size),
    lastAt: all.length ? all[all.length - 1].at : undefined,
  };
}

/**
 * Evidence confidence (Framework §35, §7 floors):
 * Early < 6 valid or a single context/source; Developing 6–11;
 * Established 12+ with diversity. Confidence is never a child score.
 */
export function confidenceOf(validCount: number, diversity: number): Confidence {
  if (validCount < 6 || diversity < 2) return 'early';
  if (validCount < 12 || diversity < 3) return 'developing';
  return 'established';
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  early: 'Early',
  developing: 'Developing',
  established: 'Established',
};

/** Emergence state 1–5 (Framework §3.1). */
export function emergenceState(s: EvidenceSummary): 1 | 2 | 3 | 4 | 5 {
  if (s.valid.some((o) => o.outcome === 'independent')) return 5;
  if (s.valid.some((o) => o.outcome === 'supported')) return 4;
  if (s.valid.some((o) => o.outcome === 'partial')) return 3;
  if (s.valid.length || s.accessLimited.length) return 2;
  return 1;
}

/** Functional-use state 1–5 (Framework §3.6). */
export function functionalUseState(s: EvidenceSummary): 1 | 2 | 3 | 4 | 5 {
  const rw = s.valid.filter((o) => o.realWorld);
  const indepSettings = new Set(rw.filter((o) => o.outcome === 'independent').map((o) => o.context.setting));
  if (indepSettings.size >= 2) return 5;
  if (rw.some((o) => o.outcome === 'independent')) return 4;
  if (rw.some(isSuccess)) return 3;
  if (rw.length) return 2;
  return 1;
}

export const EMERGENCE_LABELS = [
  'Not yet observed',
  'Engages with a model',
  'Partial demonstration',
  'Supported demonstration',
  'Independent demonstration',
];

export const FUNCTIONAL_LABELS = [
  'Structured app practice',
  'Structured real-world practice',
  'Adult-cued functional use',
  'Spontaneous functional use',
  'Independent in several real-world places',
];

export type DimensionScores = Record<GrowthDimension, number>;

/** Each dimension on 0..1, kept separate on purpose (Framework §3). */
export function dimensionScores(s: EvidenceSummary): DimensionScores {
  const evidenceWeight = Math.min(1, s.recentValid.length / 6);
  return {
    emergence: (emergenceState(s) - 1) / 4,
    reliability: s.successRate * evidenceWeight,
    independence: s.successCount ? ((7 - s.typicalSupport) / 6) * evidenceWeight : 0,
    flexibility: Math.min(s.reliableContexts.length, 3) / 3,
    retention: s.retention.probes ? s.retention.successes / s.retention.probes : 0,
    functionalUse: (functionalUseState(s) - 1) / 4,
  };
}

const WEIGHTS: DimensionScores = {
  emergence: 0.15,
  reliability: 0.2,
  independence: 0.2,
  flexibility: 0.15,
  retention: 0.15,
  functionalUse: 0.15,
};

/** Journey progress (0..1) across the six dimensions — shown as "Progress". */
export function journeyProgress(s: EvidenceSummary): number {
  const d = dimensionScores(s);
  let total = 0;
  for (const k of Object.keys(WEIGHTS) as GrowthDimension[]) total += d[k] * WEIGHTS[k];
  return Math.max(0, Math.min(1, total));
}

export function goalObservations(goal: GrowthGoal, all: Observation[]): Observation[] {
  return all.filter((o) => o.goalId === goal.id);
}

export const SUPPORT_LABELS: Record<SupportLevel, string> = {
  1: 'Independent',
  2: 'Environmental cue',
  3: 'Visual cue',
  4: 'Gestural cue',
  5: 'Model',
  6: 'Brief verbal guidance',
  7: 'Adult-supported',
};

export const OUTCOME_LABELS: Record<Outcome, string> = {
  independent: 'Independent',
  supported: 'Supported',
  partial: 'Partial',
  notDemonstrated: 'Not yet',
  accessLimited: 'Access limited',
};

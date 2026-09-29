/**
 * BrightPath Decision Rules (Framework Part III, Appendix A).
 *
 * Answers "What should BrightPath emphasize next, and why?" with an
 * explainable, deterministic recommendation. Numbers are product heuristics,
 * not clinical thresholds, and are exposed so they can be tuned.
 */
import {
  byTime,
  DAY_MS,
  isSuccess,
  sessionKey,
  summarize,
  type EvidenceSummary,
} from './evidence';
import { suggestSupportChange, type SupportChange } from './prompts';
import type {
  Confidence,
  GrowthGoal,
  JourneyMode,
  LearningTool,
  Observation,
  RecommendationKind,
} from './types';

export const HEURISTICS = {
  /** Valid opportunities below this are provisional only (§7). */
  evidenceFloor: 6,
  /** Routing default for "reasonably reliable" (not a mastery criterion). */
  reliableRate: 0.7,
  minSuccessfulDemonstrations: 2,
  minContexts: 2,
  retentionRate: 0.67,
  discoverStallDays: 28,
};

export interface Check {
  step: number;
  question: string;
  passed: boolean;
  detail: string;
}

export interface Recommendation {
  kind: RecommendationKind;
  /** Child-facing journey mode to use for missions right now. */
  mode: JourneyMode;
  title: string;
  reasons: string[];
  confidence: Confidence;
  tools: LearningTool[];
  supportChange: SupportChange | null;
  pauseAdaptation: boolean;
  humanReviewTriggers: string[];
  supportPathSuggested: boolean;
  checks: Check[];
  summary: EvidenceSummary;
}

export const KIND_LABEL: Record<RecommendationKind, string> = {
  discover: 'Discover',
  practice: 'Practice',
  explore: 'Explore',
  remember: 'Remember',
  maintain: 'Maintain / Natural Use',
  increaseSupport: 'Increase Support',
  reduceSupport: 'Reduce Support',
  gatherEvidence: 'Gather More Evidence',
  reassessAccess: 'Reassess Access',
  reviewGoal: 'Review Goal Definition',
  supportPath: 'Open Support Path Planner',
  humanReview: 'Human Review Required',
};

export const MODE_TOOLS: Record<JourneyMode, LearningTool[]> = {
  discover: ['showExplore', 'connectIt', 'tryTogether', 'tinySteps'],
  practice: ['repeatVariety', 'fadeHint', 'helpfulFeedback', 'findItAgain'],
  explore: ['changePlace', 'changePerson', 'changeMaterials', 'storySwitch', 'realWorldMission'],
  remember: ['comeBackLater', 'spacePractice', 'quickRetrieval', 'naturalUse'],
};

function sessionsOf(obs: Observation[]): Observation[][] {
  const map = new Map<string, Observation[]>();
  for (const o of [...obs].sort(byTime)) map.set(sessionKey(o), [...(map.get(sessionKey(o)) ?? []), o]);
  return [...map.values()];
}

function predominantlyAccessLimited(session: Observation[]): boolean {
  const limited = session.filter((o) => o.quality === 'accessLimited' || o.outcome === 'accessLimited').length;
  return session.length > 0 && limited / session.length >= 0.5;
}

/** Framework §8 and §28 — when automation should stop. */
export function safetyTriggers(goal: GrowthGoal, observations: Observation[], now: Date): string[] {
  const t: string[] = [];
  const sessions = sessionsOf(observations.filter((o) => o.quality !== 'invalid'));
  const lastTwo = sessions.slice(-2);

  const stopCount = lastTwo.flat().filter((o) => o.tools.includes('stop') || o.tools.includes('break') || o.tools.includes('notYet')).length;
  if (stopCount >= 3) t.push('The learner repeatedly chose Stop, Break or Not Yet around this goal.');

  const recent = [...observations].sort(byTime).slice(-5);
  if (recent.filter((o) => o.flags?.distress).length >= 2) t.push('Distress was noted more than once recently.');

  if (lastTwo.length === 2 && lastTwo.every(predominantlyAccessLimited)) {
    t.push('Two sessions in a row were mostly access-limited.');
  }

  const adapt = goal.adaptations.slice(-3);
  if (adapt.length === 3) {
    const valid = observations.filter((o) => o.quality === 'valid' && o.outcome !== 'accessLimited').sort(byTime);
    const before = valid.slice(Math.max(0, adapt[0].atValidCount - 6), adapt[0].atValidCount);
    const after = valid.slice(adapt[0].atValidCount);
    const rate = (xs: Observation[]) => (xs.length ? xs.filter(isSuccess).length / xs.length : 0);
    if (after.length >= 3 && rate(after) <= rate(before)) t.push('Three adaptive changes have not improved access or performance.');
  }

  if (goal.flags.conflictsWithAccess) t.push('The goal conflicts with the learner’s communication or access needs.');
  if (observations.some((o) => o.flags?.safety && now.getTime() - new Date(o.at).getTime() < 30 * DAY_MS)) {
    t.push('A safety concern was recorded.');
  }
  if (goal.flags.adultsDisagree) t.push('Adults disagree about what counts as success.');

  // Evidence sources strongly conflict (§8): two sources, ≥3 valid each, rates differ by > 0.6.
  const recentValid = observations.filter(
    (o) => o.quality === 'valid' && o.outcome !== 'accessLimited' && now.getTime() - new Date(o.at).getTime() < 14 * DAY_MS,
  );
  const bySource = new Map<string, Observation[]>();
  for (const o of recentValid) bySource.set(o.source, [...(bySource.get(o.source) ?? []), o]);
  const rates = [...bySource.values()].filter((v) => v.length >= 3).map((v) => v.filter(isSuccess).length / v.length);
  if (rates.length >= 2 && Math.max(...rates) - Math.min(...rates) > 0.6) t.push('Evidence from different sources strongly conflicts.');

  if (goal.flags.noLongerUseful) t.push('The goal is no longer useful or wanted.');
  if (goal.flags.highRisk) t.push('A Support Path plan for a high-risk pattern needs qualified review.');
  return t;
}

/** Provisional journey mode from the heuristics alone (used even when gathering evidence). */
export function heuristicMode(s: EvidenceSummary, goal: GrowthGoal): { mode: JourneyMode | 'maintain'; reason: string } {
  const lowSupportDemos = s.valid.filter((o) => isSuccess(o) && o.supportLevel <= 4).length;
  if (lowSupportDemos < HEURISTICS.minSuccessfulDemonstrations) {
    return {
      mode: 'discover',
      reason:
        lowSupportDemos === 0
          ? 'No full demonstration yet without heavy support — keep modelling and trying together.'
          : 'Only one full demonstration so far — keep it new and low-pressure.',
    };
  }
  const heavyShare = s.successCount ? s.recentValid.filter((o) => isSuccess(o) && o.supportLevel >= 4).length / s.successCount : 1;
  if (s.lowSupportRate < HEURISTICS.reliableRate || heavyShare > 0.4) {
    return {
      mode: 'practice',
      reason: `The skill is there, but low-support success is ${Math.round(s.lowSupportRate * 100)}% of recent tries — practise to make it easier to find.`,
    };
  }
  if (s.sessions < 2 || s.reliableContexts.length < HEURISTICS.minContexts) {
    return {
      mode: 'explore',
      reason: `Reliable in ${s.reliableContexts.length || 1} setting — try it with new places, people or materials.`,
    };
  }
  const retentionRate = s.retention.probes ? s.retention.successes / s.retention.probes : 0;
  if (!s.retention.probes || retentionRate < HEURISTICS.retentionRate) {
    return {
      mode: 'remember',
      reason: s.retention.probes
        ? 'Remembering after a break is still inconsistent — space practice out and refresh when needed.'
        : 'Reliable across settings — now check it is still there after some time passes.',
    };
  }
  if (goal.realWorldRequired && s.realWorld.successes === 0) {
    return { mode: 'remember', reason: 'No real-world use documented yet — try a Real-World Quest.' };
  }
  return { mode: 'maintain', reason: 'Independent across settings, retained over time and used in real life.' };
}

export function recommend(goal: GrowthGoal, observations: Observation[], now: Date = new Date()): Recommendation {
  const s = summarize(observations);
  const checks: Check[] = [];
  const reasons: string[] = [];
  const supportChange = suggestSupportChange(goal, observations);
  const triggers = safetyTriggers(goal, observations, now);
  const provisional = heuristicMode(s, goal);
  const mode: JourneyMode = provisional.mode === 'maintain' ? 'remember' : provisional.mode;
  const base = {
    confidence: s.confidence,
    supportChange,
    humanReviewTriggers: triggers,
    supportPathSuggested: Boolean(goal.currentPattern),
    summary: s,
    checks,
  };

  // Safety overrides first — automation pauses.
  if (triggers.length) {
    return {
      ...base,
      kind: 'humanReview',
      mode,
      title: 'Pause adaptation',
      reasons: ['A human review would be more useful than another automatic change.', ...triggers],
      tools: [],
      supportChange: null,
      pauseAdaptation: true,
    };
  }

  // Step 1 — useful, observable, agency-preserving goal?
  const goalOk =
    goal.status === 'active' &&
    goal.observableAction.trim().length > 0 &&
    goal.acceptedModalities.length > 0 &&
    goal.successDefinition.trim().length > 0;
  checks.push({
    step: 1,
    question: 'Is the goal useful, observable and agency-preserving?',
    passed: goalOk,
    detail: goalOk ? 'Observable action, accepted modalities and success are defined.' : 'Something in the goal definition is missing or paused.',
  });
  if (!goalOk) {
    return { ...base, kind: 'reviewGoal', mode, title: KIND_LABEL.reviewGoal, reasons: ['Clarify the goal before adapting the child’s experience.'], tools: [], pauseAdaptation: true };
  }

  // Step 2 — reasonable access in the latest session?
  const sessions = sessionsOf(observations.filter((o) => o.quality !== 'invalid'));
  const latest = sessions[sessions.length - 1];
  const accessOk = !latest || !predominantlyAccessLimited(latest);
  checks.push({
    step: 2,
    question: 'Was there reasonable access?',
    passed: accessOk,
    detail: accessOk ? 'Recent opportunities were accessible.' : 'Most of the latest session was access-limited.',
  });
  if (!accessOk) {
    return {
      ...base,
      kind: 'reassessAccess',
      mode,
      title: KIND_LABEL.reassessAccess,
      reasons: ['Most recent opportunities were access-limited, so they are not treated as skill failure.', 'Check sensory load, timing, communication access and readiness.'],
      tools: ['mixSenses', 'tinySteps'],
      pauseAdaptation: true,
    };
  }

  // Step 3 — enough evidence?
  const enough = s.validCount >= HEURISTICS.evidenceFloor;
  checks.push({
    step: 3,
    question: 'Is there enough evidence?',
    passed: enough,
    detail: `${s.validCount} valid opportunit${s.validCount === 1 ? 'y' : 'ies'} (floor ${HEURISTICS.evidenceFloor}).`,
  });
  if (!enough) {
    return {
      ...base,
      kind: 'gatherEvidence',
      mode,
      title: KIND_LABEL.gatherEvidence,
      reasons: [
        `Only ${s.validCount} valid opportunit${s.validCount === 1 ? 'y' : 'ies'} so far — recommendations are provisional.`,
        `For now: ${provisional.reason}`,
      ],
      tools: MODE_TOOLS[mode],
      pauseAdaptation: false,
    };
  }

  const steps: { step: number; question: string; failMode: JourneyMode | 'maintain' }[] = [
    { step: 4, question: 'Does the skill appear to exist?', failMode: 'discover' },
    { step: 5, question: 'Is it reliable and reasonably accessible?', failMode: 'practice' },
    { step: 6, question: 'Is it flexible across relevant contexts?', failMode: 'explore' },
    { step: 7, question: 'Is it retained over time?', failMode: 'remember' },
  ];
  const order: (JourneyMode | 'maintain')[] = ['discover', 'practice', 'explore', 'remember', 'maintain'];
  const reached = order.indexOf(provisional.mode);
  for (const st of steps) {
    checks.push({ step: st.step, question: st.question, passed: reached > order.indexOf(st.failMode), detail: reached === order.indexOf(st.failMode) ? provisional.reason : '' });
  }
  checks.push({ step: 8, question: 'Is it functionally useful in real life?', passed: provisional.mode === 'maintain', detail: provisional.mode === 'maintain' ? 'Documented real-world use.' : '' });

  let kind: RecommendationKind = provisional.mode;
  reasons.push(provisional.reason);
  if (supportChange && supportChange.direction === 'reduce') {
    reasons.push(supportChange.reason);
  } else if (supportChange && (supportChange.direction === 'increase' || supportChange.direction === 'restore')) {
    kind = 'increaseSupport';
    reasons.unshift(supportChange.reason);
  }
  if (goal.currentPattern) {
    reasons.push('A current pattern is recorded — the Support Path Planner can help find a preferred path.');
  }

  return {
    ...base,
    kind,
    mode,
    title: KIND_LABEL[kind],
    reasons,
    tools: provisional.mode === 'maintain' ? ['naturalUse', 'refreshWhenNeeded'] : MODE_TOOLS[mode],
    pauseAdaptation: false,
  };
}

export const MODE_COPY: Record<JourneyMode, { child: string; label: string }> = {
  discover: { child: 'This is new. Let’s meet it.', label: 'Discover' },
  practice: { child: 'Let’s make it easier to find again.', label: 'Practice' },
  explore: { child: 'Can we use it somewhere new?', label: 'Explore' },
  remember: { child: 'Can we find it again later?', label: 'Remember' },
};

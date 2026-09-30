import { router } from 'expo-router';
import { createContext, useContext } from 'react';

import type { Mission, MissionStep, StepEvidence } from '@/content/types';
import { supportForMode } from '@/engine/prompts';
import type { AgencyTool, Learner, Modality, OpportunityQuality, Outcome, SupportLevel } from '@/engine/types';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';

export interface StepProps<T extends MissionStep = MissionStep> {
  mission: Mission;
  step: T;
  index: number;
  learner: Learner;
  next: () => void;
}

export const MissionCtx = createContext<{ mission: Mission; index: number } | null>(null);
export function useMissionCtx() {
  return useContext(MissionCtx);
}

export function goToStep(missionId: string, index: number) {
  router.push({ pathname: '/kid/mission/[id]', params: { id: missionId, step: String(index) } });
}

/** Deterministic shuffle (Fisher–Yates on a string-seeded PRNG): stable within a run, varied across steps and runs. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function goalForEvidence(learnerId: string, ev: StepEvidence) {
  const goals = useApp.getState().goals;
  return goals.find((g) => g.learnerId === learnerId && g.templateId === ev.templateId && g.status === 'active');
}

/** Base in-app support for this learner & evidence target. */
export function baseSupport(learnerId: string, ev: StepEvidence, band: Learner['band']): SupportLevel {
  const goal = goalForEvidence(learnerId, ev);
  if (goal) return goal.supportLevel;
  // No Growth Goal linked: offer a visual cue after a pause rather than a model.
  return Math.min(3, supportForMode(useMission.getState().mode, band)) as SupportLevel;
}

/** A check-in counts only for the session it was made in (3 h at most). */
const READINESS_TTL_MS = 3 * 60 * 60 * 1000;

/**
 * Records one in-app opportunity. Outcome/support follow Framework §34:
 * success at level 1 = Independent, success with any cue = Supported.
 * A fresh Tired check-in marks the opportunity Access Limited. Each step
 * records at most once per run (Back and replays don't add evidence).
 */
export function recordAppEvidence(p: {
  learner: Learner;
  mission: Mission;
  ev: StepEvidence;
  stepId: string;
  success: boolean;
  support: SupportLevel;
  modality?: Modality;
  extraTools?: AgencyTool[];
  note?: string;
  /** Overrides the computed quality (e.g. modelled practice is not graded). */
  quality?: OpportunityQuality;
  extraTags?: string[];
}) {
  const session = useMission.getState();
  if (!session.markRecorded(p.stepId)) return undefined;
  const app = useApp.getState();
  const goal = goalForEvidence(p.learner.id, p.ev);
  const { readiness, startedAt, gentle } = app.session;
  const fresh = !!startedAt && Date.now() - new Date(startedAt).getTime() <= READINESS_TTL_MS;
  const tired = fresh && readiness === 'needBreak';
  const support = (fresh && gentle ? Math.max(p.support, 3) : p.support) as SupportLevel;
  const outcome: Outcome = p.success ? (support <= 1 ? 'independent' : 'supported') : 'partial';
  return app.recordObservation({
    learnerId: p.learner.id,
    goalId: goal?.id,
    skillArea: p.ev.skillArea,
    missionId: p.mission.id,
    source: 'app',
    at: new Date().toISOString(),
    context: { setting: 'app', activity: p.mission.title },
    quality: p.quality ?? (tired ? 'accessLimited' : 'valid'),
    outcome,
    supportLevel: support,
    modality: p.modality ?? 'tap',
    responseMs: Date.now() - session.stepStartedAt,
    tools: [...new Set([...session.tools, ...(p.extraTools ?? [])])],
    tags: [...new Set([...(p.ev.tags ?? []), ...(p.extraTags ?? [])])],
    note: p.note,
  });
}

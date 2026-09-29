import { router } from 'expo-router';
import { createContext, useContext } from 'react';

import type { Mission, MissionStep, StepEvidence } from '@/content/types';
import { supportForMode } from '@/engine/prompts';
import type { AgencyTool, Learner, Modality, Outcome, SupportLevel } from '@/engine/types';
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

/**
 * Records one in-app opportunity. Outcome/support follow Framework §34:
 * success at level 1 = Independent, success with any cue = Supported.
 * Tired check-ins mark the opportunity Access Limited.
 */
export function recordAppEvidence(p: {
  learner: Learner;
  mission: Mission;
  ev: StepEvidence;
  success: boolean;
  support: SupportLevel;
  modality?: Modality;
  extraTools?: AgencyTool[];
  note?: string;
}) {
  const app = useApp.getState();
  const session = useMission.getState();
  const goal = goalForEvidence(p.learner.id, p.ev);
  const outcome: Outcome = p.success ? (p.support <= 1 ? 'independent' : 'supported') : 'partial';
  const tired = app.session.readiness === 'needBreak';
  return app.recordObservation({
    learnerId: p.learner.id,
    goalId: goal?.id,
    skillArea: p.ev.skillArea,
    missionId: p.mission.id,
    source: 'app',
    at: new Date().toISOString(),
    context: { setting: 'app', activity: p.mission.title },
    quality: tired ? 'accessLimited' : 'valid',
    outcome,
    supportLevel: p.support,
    modality: p.modality ?? 'tap',
    responseMs: Date.now() - session.stepStartedAt,
    tools: [...new Set([...session.tools, ...(p.extraTools ?? [])])],
    tags: p.ev.tags ?? [],
    note: p.note,
  });
}

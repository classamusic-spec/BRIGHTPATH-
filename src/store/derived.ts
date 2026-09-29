/**
 * Derived, memoised views over the store. Components select raw slices and
 * compute here so recommendations stay explainable and in one place.
 */
import { useMemo } from 'react';

import { missionById, MISSIONS } from '@/content/missions';
import type { Mission } from '@/content/types';
import { contextMatrix } from '@/engine/context';
import { recommend, type Recommendation } from '@/engine/decision';
import { dimensionScores, journeyProgress, summarize, type DimensionScores, type EvidenceSummary } from '@/engine/evidence';
import { isDue } from '@/engine/spaced';
import { areaScore, dayCounts, isCelebration, keyInsights, patterns, progressReport, startOfDay, weeklySummary, type RangeKey } from '@/engine/summary';
import type { GrowthGoal, JourneyMode, Observation, SkillArea } from '@/engine/types';

import { useApp } from './index';

const DAY = 24 * 3600 * 1000;

export function useNow(): Date {
  // Stable for the lifetime of a screen render cycle.
  return useMemo(() => new Date(), []);
}

export function useLearnerGoals(learnerId: string): GrowthGoal[] {
  const goals = useApp((s) => s.goals);
  return useMemo(() => goals.filter((g) => g.learnerId === learnerId), [goals, learnerId]);
}

export function useLearnerObservations(learnerId: string): Observation[] {
  const obs = useApp((s) => s.observations);
  return useMemo(() => obs.filter((o) => o.learnerId === learnerId), [obs, learnerId]);
}

export interface GoalView {
  goal: GrowthGoal;
  observations: Observation[];
  summary: EvidenceSummary;
  dims: DimensionScores;
  progress: number;
  rec: Recommendation;
}

export function goalView(goal: GrowthGoal, all: Observation[], now: Date): GoalView {
  const observations = all.filter((o) => o.goalId === goal.id);
  const summary = summarize(observations);
  return {
    goal,
    observations,
    summary,
    dims: dimensionScores(summary),
    progress: journeyProgress(summary),
    rec: recommend(goal, observations, now),
  };
}

export function useGoalView(goalId: string | undefined): GoalView | null {
  const goal = useApp((s) => s.goals.find((g) => g.id === goalId));
  const obs = useApp((s) => s.observations);
  return useMemo(() => (goal ? goalView(goal, obs, new Date()) : null), [goal, obs]);
}

export function useGoalViews(learnerId?: string): GoalView[] {
  const goals = useApp((s) => s.goals);
  const obs = useApp((s) => s.observations);
  return useMemo(() => {
    const now = new Date();
    return goals.filter((g) => !learnerId || g.learnerId === learnerId).map((g) => goalView(g, obs, now));
  }, [goals, obs, learnerId]);
}

const MODE_ORDER: Record<JourneyMode, number> = { discover: 0, practice: 1, explore: 2, remember: 3 };

/** Today's Mission: the due goal with the most pressing journey mode. */
export function useTodayMission(learnerId: string): { mission: Mission; goal?: GrowthGoal; mode: JourneyMode } {
  const views = useGoalViews(learnerId);
  return useMemo(() => {
    const now = new Date();
    const active = views.filter((v) => v.goal.status === 'active' && !v.rec.pauseAdaptation && v.goal.missionIds.length);
    active.sort((a, b) => {
      const due = Number(isDue(b.goal.spaced, now)) - Number(isDue(a.goal.spaced, now));
      if (due) return due;
      const m = MODE_ORDER[a.rec.mode] - MODE_ORDER[b.rec.mode];
      if (m) return m;
      return (a.goal.spaced.nextDue ?? '').localeCompare(b.goal.spaced.nextDue ?? '');
    });
    for (const v of active) {
      const fit = v.goal.missionIds.map((id) => missionById(id)).find((m) => m && m.journeyModes.includes(v.rec.mode)) ?? missionById(v.goal.missionIds[0]);
      if (fit) return { mission: fit, goal: v.goal, mode: v.rec.mode };
    }
    return { mission: missionById('be-kind-home') ?? MISSIONS[0], mode: 'discover' };
  }, [views]);
}

export function useAreaScores(learnerId: string, days = 30, areas: SkillArea[]) {
  const obs = useLearnerObservations(learnerId);
  return useMemo(() => {
    const since = Date.now() - days * DAY;
    const recent = obs.filter((o) => new Date(o.at).getTime() >= since);
    return areas.map((area) => ({ area, ...areaScore(recent, area) }));
  }, [obs, days, areas]);
}

export function useContextMatrix(learnerId: string, days = 60) {
  const obs = useLearnerObservations(learnerId);
  return useMemo(() => contextMatrix(obs, new Date(Date.now() - days * DAY)), [obs, days]);
}

export function useWeekly(learnerId: string, name: string, anchor: Date) {
  const goals = useLearnerGoals(learnerId);
  const obs = useLearnerObservations(learnerId);
  return useMemo(() => weeklySummary(name, goals, obs, anchor), [goals, obs, name, anchor]);
}

export function useInsights(learnerId: string, name: string) {
  const obs = useLearnerObservations(learnerId);
  return useMemo(() => {
    const now = new Date();
    return { key: keyInsights(name, obs, now), patterns: patterns(name, obs, now) };
  }, [obs, name]);
}

export function useProgressReport(learnerId: string, range: RangeKey) {
  const goals = useLearnerGoals(learnerId);
  const obs = useLearnerObservations(learnerId);
  return useMemo(() => progressReport(goals, obs, range, new Date()), [goals, obs, range]);
}

export interface DashboardStats {
  learners: number;
  goalsInProgress: number;
  needSupport: string[];
  celebrations: number;
  days: { label: string; count: number }[];
}

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function useDashboard(learnerIds: string[]): DashboardStats {
  const goals = useApp((s) => s.goals);
  const obs = useApp((s) => s.observations);
  return useMemo(() => {
    const now = new Date();
    const mine = obs.filter((o) => learnerIds.includes(o.learnerId));
    const active = goals.filter((g) => g.status === 'active' && learnerIds.includes(g.learnerId));
    const since30 = new Date(now.getTime() - 30 * DAY);
    const needSupport = learnerIds.filter((id) => {
      const lobs = mine.filter((o) => o.learnerId === id);
      const flagged = active
        .filter((g) => g.learnerId === id)
        .some((g) => {
          const r = recommend(g, lobs.filter((o) => o.goalId === g.id), now);
          return ['increaseSupport', 'reassessAccess', 'humanReview', 'reviewGoal'].includes(r.kind);
        });
      const cells = contextMatrix(lobs, since30).flat();
      return flagged || cells.some((c) => c.status === 'needs');
    });
    const start = startOfDay(new Date(now.getTime() - 6 * DAY));
    const counts = dayCounts(mine, start);
    const days = counts.map((count, i) => ({ label: DAY_LETTER[new Date(start.getTime() + i * DAY).getDay()], count }));
    const celebrations = mine.filter((o) => new Date(o.at) >= start && isCelebration(o)).length;
    return { learners: learnerIds.length, goalsInProgress: active.length, needSupport, celebrations, days };
  }, [goals, obs, learnerIds]);
}

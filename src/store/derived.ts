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
import type { GrowthGoal, JourneyMode, Observation, RecommendationKind, SkillArea } from '@/engine/types';
import { useClock } from '@/lib/clock';

import { useApp } from './index';

const DAY = 24 * 3600 * 1000;

/** The current time as a Date, refreshed every minute. */
export function useNow(): Date {
  const t = useClock();
  return useMemo(() => new Date(t), [t]);
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
  const now = useNow();
  return useMemo(() => (goal ? goalView(goal, obs, now) : null), [goal, obs, now]);
}

export function useGoalViews(learnerId?: string): GoalView[] {
  const goals = useApp((s) => s.goals);
  const obs = useApp((s) => s.observations);
  const now = useNow();
  return useMemo(() => goals.filter((g) => !learnerId || g.learnerId === learnerId).map((g) => goalView(g, obs, now)), [goals, obs, learnerId, now]);
}

const MODE_ORDER: Record<JourneyMode, number> = { discover: 0, practice: 1, explore: 2, remember: 3 };

/** Today's Mission: the due goal with the most pressing journey mode. */
function pickTodayMission(views: GoalView[], now: Date): { mission: Mission; goal?: GrowthGoal; mode: JourneyMode } {
  const active = views
    .filter((v) => v.goal.status === 'active' && !v.rec.pauseAdaptation && v.goal.missionIds.length)
    .sort((a, b) => {
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
}

export function useTodayMission(learnerId: string): { mission: Mission; goal?: GrowthGoal; mode: JourneyMode } {
  const views = useGoalViews(learnerId);
  const now = useNow();
  return useMemo(() => pickTodayMission(views, now), [views, now]);
}

export function useAreaScores(learnerId: string, days = 30, areas: SkillArea[]) {
  const obs = useLearnerObservations(learnerId);
  const now = useClock();
  return useMemo(() => {
    const since = now - days * DAY;
    const recent = obs.filter((o) => new Date(o.at).getTime() >= since);
    return areas.map((area) => ({ area, ...areaScore(recent, area) }));
  }, [obs, days, areas, now]);
}

export function useContextMatrix(learnerId: string, days = 60) {
  const obs = useLearnerObservations(learnerId);
  const now = useClock();
  return useMemo(() => contextMatrix(obs, new Date(now - days * DAY)), [obs, days, now]);
}

export function useWeekly(learnerId: string, name: string, anchor: Date) {
  const goals = useLearnerGoals(learnerId);
  const obs = useLearnerObservations(learnerId);
  const now = useNow();
  return useMemo(() => weeklySummary(name, goals, obs, anchor, now), [goals, obs, name, anchor, now]);
}

export function useInsights(learnerId: string, name: string) {
  const obs = useLearnerObservations(learnerId);
  const now = useNow();
  return useMemo(() => ({ key: keyInsights(name, obs, now), patterns: patterns(name, obs, now) }), [obs, name, now]);
}

export function useProgressReport(learnerId: string, range: RangeKey) {
  const goals = useLearnerGoals(learnerId);
  const obs = useLearnerObservations(learnerId);
  const now = useNow();
  return useMemo(() => progressReport(goals, obs, range, now), [goals, obs, range, now]);
}

export type ReviewKind = 'increaseSupport' | 'reassessAccess' | 'humanReview' | 'reviewGoal';
const REVIEW_KINDS: RecommendationKind[] = ['increaseSupport', 'reassessAccess', 'humanReview', 'reviewGoal'];

export interface GoalToReview {
  learnerId: string;
  goalId: string;
  kind: ReviewKind;
  reason: string;
}

/**
 * The one "Need Support" rule: active goals whose recommendation asks the
 * adult to review something (support, access, the goal itself). It describes
 * the plan, never the child.
 */
export function selectGoalsToReview(goals: GrowthGoal[], obs: Observation[], learnerIds: string[], now: Date): GoalToReview[] {
  const out: GoalToReview[] = [];
  for (const g of goals) {
    if (g.status !== 'active' || !learnerIds.includes(g.learnerId)) continue;
    const r = recommend(g, obs.filter((o) => o.goalId === g.id), now);
    if (REVIEW_KINDS.includes(r.kind)) out.push({ learnerId: g.learnerId, goalId: g.id, kind: r.kind as ReviewKind, reason: r.reasons[0] ?? r.title });
  }
  return out;
}

/** Active goals that simply need more observations before anything can be said. */
export function selectGoalsGathering(goals: GrowthGoal[], obs: Observation[], learnerIds: string[], now: Date): { learnerId: string; goalId: string }[] {
  return goals
    .filter((g) => g.status === 'active' && learnerIds.includes(g.learnerId))
    .filter((g) => recommend(g, obs.filter((o) => o.goalId === g.id), now).kind === 'gatherEvidence')
    .map((g) => ({ learnerId: g.learnerId, goalId: g.id }));
}

export function useGoalsToReview(learnerIds: string[]): GoalToReview[] {
  const goals = useApp((s) => s.goals);
  const obs = useApp((s) => s.observations);
  const now = useNow();
  return useMemo(() => selectGoalsToReview(goals, obs, learnerIds, now), [goals, obs, learnerIds, now]);
}

export interface DashboardStats {
  learners: number;
  goalsInProgress: number;
  /** Distinct learners with at least one goal to review (see selectGoalsToReview). */
  needSupport: string[];
  review: GoalToReview[];
  gathering: { learnerId: string; goalId: string }[];
  celebrations: number;
  days: { label: string; count: number }[];
}

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function useDashboard(learnerIds: string[]): DashboardStats {
  const goals = useApp((s) => s.goals);
  const obs = useApp((s) => s.observations);
  const now = useNow();
  return useMemo(() => {
    const mine = obs.filter((o) => learnerIds.includes(o.learnerId));
    const active = goals.filter((g) => g.status === 'active' && learnerIds.includes(g.learnerId));
    const review = selectGoalsToReview(goals, mine, learnerIds, now);
    const needSupport = learnerIds.filter((id) => review.some((r) => r.learnerId === id));
    const gathering = selectGoalsGathering(goals, mine, learnerIds, now);
    const start = startOfDay(new Date(now.getTime() - 6 * DAY));
    const counts = dayCounts(mine, start);
    const days = counts.map((count, i) => ({ label: DAY_LETTER[new Date(start.getTime() + i * DAY).getDay()], count }));
    const celebrations = mine.filter((o) => new Date(o.at) >= start && isCelebration(o)).length;
    return { learners: learnerIds.length, goalsInProgress: active.length, needSupport, review, gathering, celebrations, days };
  }, [goals, obs, learnerIds, now]);
}

/**
 * BrightPath local-first store (Framework §56, §60): the device is the source
 * of truth for the core offline flow. Reward data is kept separate from
 * learning evidence, and every observation keeps version metadata.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { missionById } from '@/content/missions';
import { BADGES, ROOM_ITEMS } from '@/content/rewards';
import { recommend } from '@/engine/decision';
import { suggestSupportChange } from '@/engine/prompts';
import { FEELING_TO_READINESS } from '@/engine/readiness';
import { schedule } from '@/engine/spaced';
import {
  VERSIONS,
  type AccessProfile,
  type Badge,
  type Feeling,
  type GrowthGoal,
  type Learner,
  type NotificationPrefs,
  type Observation,
  type Readiness,
  type Rewards,
  type Setting,
  type SkillArea,
  type SupportPathPlan,
  type TeamMember,
} from '@/engine/types';

import { DEFAULT_ACCESS, DEFAULT_NOTIFICATIONS, EMPTY_REWARDS } from './defaults';
import { migrateStore, STORE_VERSION } from './migrations';
import { ALEX_ID, buildSeed } from './seed';

export interface RealWorldQuest {
  id: string;
  learnerId: string;
  missionId: string;
  title: string;
  quest: string;
  setting: Setting;
  skillArea: SkillArea;
  goalId?: string;
  acceptedAt: string;
  status: 'open' | 'recorded';
  observationId?: string;
}

export interface Session {
  feeling?: Feeling;
  readiness?: Readiness;
  startedAt?: string;
  quiet: boolean;
}

export interface MissionRun {
  id: string;
  learnerId: string;
  missionId: string;
  startedAt: string;
  completedAt?: string;
  hintsUsed: number;
}

export interface AppData {
  initialized: boolean;
  demoData: boolean;
  onboarded: boolean;
  adultName: string;
  learners: Learner[];
  activeLearnerId: string;
  goals: GrowthGoal[];
  observations: Observation[];
  team: TeamMember[];
  plans: SupportPathPlan[];
  rewards: Record<string, Rewards>;
  quests: RealWorldQuest[];
  runs: MissionRun[];
  session: Session;
  notifications: NotificationPrefs;
  consent: { analytics: boolean; cloudSync: boolean; photos: boolean };
  language: 'en';
  appearance: 'light';
}

type NewObservation = Omit<Observation, 'id' | 'versions' | 'tools' | 'tags' | 'quality'> &
  Partial<Pick<Observation, 'tools' | 'tags' | 'quality'>>;

export interface AppActions {
  seedDemo: (now?: Date) => void;
  deleteAllData: () => void;
  exportData: () => string;
  setActiveLearner: (id: string) => void;
  chooseBuddy: (buddy: Learner['buddy']) => void;
  checkIn: (feeling: Feeling) => Readiness;
  setQuiet: (quiet: boolean) => void;
  recordObservation: (o: NewObservation) => Observation;
  deleteObservation: (id: string) => void;
  addGoal: (g: Omit<GrowthGoal, 'id' | 'createdAt' | 'adaptations' | 'spaced'>) => string;
  updateGoal: (id: string, patch: Partial<GrowthGoal>) => void;
  deleteGoal: (id: string) => void;
  startMission: (missionId: string) => string;
  useHint: (runId: string) => void;
  finishMission: (runId: string) => { stars: number; badge?: Badge['id'] };
  earnStars: (n: number, reason: string) => void;
  togglePlaced: (itemId: string) => void;
  acceptQuest: (q: Omit<RealWorldQuest, 'id' | 'acceptedAt' | 'status' | 'learnerId'>) => void;
  resolveQuest: (id: string, observationId: string) => void;
  updateLearner: (id: string, patch: Partial<Learner>) => void;
  updateAccess: (id: string, patch: Partial<AccessProfile>) => void;
  addLearner: (l: Pick<Learner, 'displayName' | 'age' | 'grade'>) => string;
  addTeamMember: (m: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  savePlan: (p: SupportPathPlan) => void;
  setNotifications: (patch: Partial<NotificationPrefs>) => void;
  setConsent: (patch: Partial<AppData['consent']>) => void;
  setAdultName: (name: string) => void;
}

export type AppState = AppData & AppActions & { hydrated: boolean };

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function blankLearner(): Learner {
  return {
    id: uid('learner'),
    displayName: 'Friend',
    buddy: 'maple',
    interests: [],
    strengths: [],
    band: 'B',
    access: DEFAULT_ACCESS,
    createdAt: new Date().toISOString(),
  };
}

function emptyData(): AppData {
  const l = blankLearner();
  return {
    initialized: true,
    demoData: false,
    onboarded: false,
    adultName: 'Grown-up',
    learners: [l],
    activeLearnerId: l.id,
    goals: [],
    observations: [],
    team: [{ id: 'tm-you', name: 'You', role: 'parent', title: 'Parent / Caregiver', permission: 'owner', avatar: 'you', learnerIds: [l.id], isSelf: true }],
    plans: [],
    rewards: { [l.id]: EMPTY_REWARDS },
    quests: [],
    runs: [],
    session: { quiet: false },
    notifications: DEFAULT_NOTIFICATIONS,
    consent: { analytics: false, cloudSync: false, photos: true },
    language: 'en',
    appearance: 'light',
  };
}

function demoData(now = new Date()): AppData {
  const seed = buildSeed(now);
  return {
    ...emptyData(),
    demoData: true,
    onboarded: true,
    adultName: 'Taylor',
    learners: seed.learners,
    activeLearnerId: ALEX_ID,
    goals: seed.goals,
    observations: seed.observations,
    team: seed.team,
    plans: seed.plans,
    rewards: seed.rewards,
  };
}

const DATA_KEYS: (keyof AppData)[] = [
  'initialized',
  'demoData',
  'onboarded',
  'adultName',
  'learners',
  'activeLearnerId',
  'goals',
  'observations',
  'team',
  'plans',
  'rewards',
  'quests',
  'runs',
  'session',
  'notifications',
  'consent',
  'language',
  'appearance',
];

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      initialized: false,
      hydrated: false,

      seedDemo: (now) => set({ ...demoData(now) }),
      deleteAllData: () => set({ ...emptyData() }),
      exportData: () => {
        const s = get();
        const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), versions: VERSIONS };
        for (const k of DATA_KEYS) data[k] = s[k];
        return JSON.stringify(data, null, 2);
      },

      setActiveLearner: (id) => set({ activeLearnerId: id }),
      chooseBuddy: (buddy) =>
        set((s) => ({
          onboarded: true,
          learners: s.learners.map((l) => (l.id === s.activeLearnerId ? { ...l, buddy } : l)),
        })),
      checkIn: (feeling) => {
        const readiness = FEELING_TO_READINESS[feeling];
        set((s) => ({
          session: { ...s.session, feeling, readiness, startedAt: new Date().toISOString(), quiet: readiness === 'quiet' || readiness === 'littleOff' || readiness === 'needBreak' },
        }));
        return readiness;
      },
      setQuiet: (quiet) => set((s) => ({ session: { ...s.session, quiet } })),

      recordObservation: (input) => {
        const o: Observation = {
          quality: input.outcome === 'accessLimited' ? 'accessLimited' : 'valid',
          tools: [],
          tags: [],
          ...input,
          id: uid('obs'),
          versions: { content: VERSIONS.content, logic: VERSIONS.decisionLogic, evidence: VERSIONS.evidenceSchema },
        };
        set((s) => {
          const observations = [...s.observations, o];
          if (!o.goalId) return { observations };
          const goals = s.goals.map((g) => {
            if (g.id !== o.goalId) return g;
            let next: GrowthGoal = { ...g };
            if (o.quality !== 'invalid') next.spaced = schedule(g.spaced, o.outcome, new Date(o.at));
            const goalObs = observations.filter((x) => x.goalId === g.id);
            const rec = recommend(next, goalObs);
            if (!rec.pauseAdaptation) {
              const change = suggestSupportChange(next, goalObs);
              if (change) {
                const validCount = goalObs.filter((x) => x.quality === 'valid' && x.outcome !== 'accessLimited').length;
                next = {
                  ...next,
                  supportLevel: change.to,
                  adaptations: [
                    ...next.adaptations,
                    {
                      at: new Date().toISOString(),
                      kind: change.direction === 'reduce' ? 'fade' : change.direction === 'restore' ? 'restore' : 'increase',
                      from: change.from,
                      to: change.to,
                      reason: change.reason,
                      atValidCount: validCount,
                    },
                  ],
                };
              }
            }
            return next;
          });
          return { observations, goals };
        });
        return o;
      },
      deleteObservation: (id) => set((s) => ({ observations: s.observations.filter((o) => o.id !== id) })),

      addGoal: (g) => {
        const id = uid('goal');
        set((s) => ({
          goals: [...s.goals, { ...g, id, createdAt: new Date().toISOString(), adaptations: [], spaced: { index: 0 } }],
        }));
        return id;
      },
      updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          observations: s.observations.map((o) => (o.goalId === id ? { ...o, goalId: undefined } : o)),
        })),

      startMission: (missionId) => {
        const id = uid('run');
        set((s) => ({ runs: [...s.runs.slice(-80), { id, learnerId: s.activeLearnerId, missionId, startedAt: new Date().toISOString(), hintsUsed: 0 }] }));
        return id;
      },
      useHint: (runId) => set((s) => ({ runs: s.runs.map((r) => (r.id === runId ? { ...r, hintsUsed: r.hintsUsed + 1 } : r)) })),
      finishMission: (runId) => {
        const s = get();
        const run = s.runs.find((r) => r.id === runId);
        const mission = run ? missionById(run.missionId) : undefined;
        if (!run || !mission || run.completedAt) return { stars: 0 };
        const learnerId = run.learnerId;
        const rw = s.rewards[learnerId] ?? EMPTY_REWARDS;
        const hasBadge = rw.badges.some((b) => b.id === mission.badge);
        const now = new Date().toISOString();
        const next: Rewards = {
          ...rw,
          stars: rw.stars + mission.stars,
          badges: hasBadge ? rw.badges : [...rw.badges, { id: mission.badge, earnedAt: now }],
          history: [...rw.history.slice(-50), { at: now, stars: mission.stars, reason: `Finished ${mission.title}` }],
        };
        // auto-place newly unlocked room items
        for (const item of ROOM_ITEMS) if (next.stars >= item.unlockAt && rw.stars < item.unlockAt && !next.placed.includes(item.id)) next.placed = [...next.placed, item.id];
        set({ rewards: { ...s.rewards, [learnerId]: next }, runs: s.runs.map((r) => (r.id === runId ? { ...r, completedAt: now } : r)) });
        return { stars: mission.stars, badge: hasBadge ? undefined : mission.badge };
      },
      earnStars: (n, reason) =>
        set((s) => {
          const rw = s.rewards[s.activeLearnerId] ?? EMPTY_REWARDS;
          return {
            rewards: {
              ...s.rewards,
              [s.activeLearnerId]: { ...rw, stars: rw.stars + n, history: [...rw.history.slice(-50), { at: new Date().toISOString(), stars: n, reason }] },
            },
          };
        }),
      togglePlaced: (itemId) =>
        set((s) => {
          const rw = s.rewards[s.activeLearnerId] ?? EMPTY_REWARDS;
          const placed = rw.placed.includes(itemId) ? rw.placed.filter((x) => x !== itemId) : [...rw.placed, itemId];
          return { rewards: { ...s.rewards, [s.activeLearnerId]: { ...rw, placed } } };
        }),

      acceptQuest: (q) =>
        set((s) => ({
          quests: [...s.quests, { ...q, id: uid('quest'), learnerId: s.activeLearnerId, acceptedAt: new Date().toISOString(), status: 'open' }],
        })),
      resolveQuest: (id, observationId) =>
        set((s) => ({ quests: s.quests.map((q) => (q.id === id ? { ...q, status: 'recorded', observationId } : q)) })),

      updateLearner: (id, patch) => set((s) => ({ learners: s.learners.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      updateAccess: (id, patch) =>
        set((s) => ({ learners: s.learners.map((l) => (l.id === id ? { ...l, access: { ...l.access, ...patch } } : l)) })),
      addLearner: (l) => {
        const learner: Learner = { ...blankLearner(), ...l };
        set((s) => ({
          learners: [...s.learners, learner],
          rewards: { ...s.rewards, [learner.id]: EMPTY_REWARDS },
          team: s.team.map((m) => (m.isSelf ? { ...m, learnerIds: [...m.learnerIds, learner.id] } : m)),
        }));
        return learner.id;
      },
      addTeamMember: (m) => set((s) => ({ team: [...s.team, { ...m, id: uid('tm') }] })),
      updateTeamMember: (id, patch) => set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeTeamMember: (id) => set((s) => ({ team: s.team.filter((m) => m.id !== id || m.isSelf) })),
      savePlan: (p) =>
        set((s) => ({ plans: s.plans.some((x) => x.id === p.id) ? s.plans.map((x) => (x.id === p.id ? p : x)) : [...s.plans, p] })),
      setNotifications: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),
      setConsent: (patch) => set((s) => ({ consent: { ...s.consent, ...patch } })),
      setAdultName: (adultName) => set({ adultName }),
    }),
    {
      name: 'brightpath-v2',
      version: STORE_VERSION,
      migrate: (persisted, fromVersion) => migrateStore(persisted as Partial<AppData>, fromVersion) as AppState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const out: Partial<AppData> = {};
        for (const k of DATA_KEYS) (out as Record<string, unknown>)[k] = s[k];
        return out as AppData;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn('BrightPath: could not restore saved data', error);
        const s = useApp.getState();
        if (!state?.initialized && !s.initialized) s.seedDemo();
        useApp.setState({ hydrated: true });
      },
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectLearner = (s: AppState) => s.learners.find((l) => l.id === s.activeLearnerId) ?? s.learners[0];

export function useLearner(): Learner {
  return useApp(selectLearner);
}

export function useRewards(): Rewards {
  return useApp((s) => s.rewards[s.activeLearnerId] ?? EMPTY_REWARDS);
}

export function badgeInfo(id: Badge['id']) {
  return BADGES[id];
}

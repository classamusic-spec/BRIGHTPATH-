/**
 * BrightPath local-first store (Framework §56, §60): the device is the source
 * of truth for the core offline flow. Reward data is kept separate from
 * learning evidence, and every observation keeps version metadata.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState as NativeAppState } from 'react-native';
import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';

import { missionById } from '@/content/missions';
import { BADGES, ROOM_ITEMS } from '@/content/rewards';
import { recommend } from '@/engine/decision';
import { suggestSupportChange } from '@/engine/prompts';
import { FEELING_TO_READINESS, sessionEffects } from '@/engine/readiness';
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
import { buildSeed, DEMO_CHILD_ID } from './seed';
import { CUSTOM_PREFIX, DEFAULT_TALK, MAX_CUSTOM_CARDS, withRecent, type TalkCustomCard, type TalkPrefs } from './talk';

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
  /** Mission run the quest came from (accepting twice from one run is a no-op). */
  runId?: string;
}

export interface Session {
  feeling?: Feeling;
  readiness?: Readiness;
  startedAt?: string;
  quiet: boolean;
  /** Shorter missions, one more support step, less novelty (from the check-in). */
  gentle?: boolean;
}

export interface MissionRun {
  id: string;
  learnerId: string;
  missionId: string;
  startedAt: string;
  completedAt?: string;
  /** Set when the child left before the end (All Done, Stop, back). Never a penalty. */
  abandonedAt?: string;
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
  /** Talk board settings and own words, per learner. */
  talk: Record<string, TalkPrefs>;
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
  /** Clears today's check-in (feeling, readiness, quiet and gentle). */
  resetSession: () => void;
  recordObservation: (o: NewObservation) => Observation;
  /** Adds a note and tags to an existing observation; evidence and support are not recomputed. */
  annotateObservation: (id: string, patch: { note?: string; tags?: string[] }) => void;
  deleteObservation: (id: string) => void;
  addGoal: (g: Omit<GrowthGoal, 'id' | 'createdAt' | 'adaptations' | 'spaced'>) => string;
  updateGoal: (id: string, patch: Partial<GrowthGoal>) => void;
  deleteGoal: (id: string) => void;
  startMission: (missionId: string) => string;
  useHint: (runId: string) => void;
  /** Awards stars once per run; a second call returns { stars: 0 }. */
  finishMission: (runId: string) => { stars: number; badge?: Badge['id'] };
  /** Marks a run the child left early. No-op for finished runs. */
  abandonRun: (runId: string) => void;
  earnStars: (n: number, reason: string) => void;
  togglePlaced: (itemId: string) => void;
  /** No-op when a quest from the same `runId` was already accepted. */
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
  updateTalk: (learnerId: string, patch: Partial<Omit<TalkPrefs, 'custom' | 'recents'>>) => void;
  /** Remembers a card the child used, when recents are kept. Talk is never evidence. */
  noteTalkUse: (learnerId: string, cardId: string) => void;
  clearTalkRecents: (learnerId: string) => void;
  /** Returns the new card's id, or null when the board is full. */
  addTalkCard: (learnerId: string, card: Omit<TalkCustomCard, 'id'>) => string | null;
  updateTalkCard: (learnerId: string, id: string, patch: Partial<Omit<TalkCustomCard, 'id'>>) => void;
  removeTalkCard: (learnerId: string, id: string) => void;
  /** Tries to read saved data again after a failed load. */
  retryLoad: () => Promise<void>;
}

/** Why saved data could not be read. Not persisted; while set, nothing is written. */
export interface LoadError {
  message: string;
  /** The unreadable saved data was copied to BACKUP_KEY. */
  backedUp: boolean;
}

export type AppState = AppData & AppActions & { hydrated: boolean; loadError: LoadError | null };

const STORAGE_KEY = 'brightpath-v2';
export const BACKUP_KEY = 'brightpath-v2-backup';
const WRITE_DEBOUNCE_MS = 500;

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
    consent: { analytics: false, cloudSync: false, photos: false },
    language: 'en',
    appearance: 'light',
    talk: {},
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
    activeLearnerId: DEMO_CHILD_ID,
    goals: seed.goals,
    observations: seed.observations,
    team: seed.team,
    plans: seed.plans,
    rewards: seed.rewards,
    talk: seed.talk,
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
  'talk',
];

/* ------------------------------------------------------------------ */
/* Storage: tells "nothing saved" apart from "could not read", never    */
/* writes over data it failed to load, and batches writes.              */
/* ------------------------------------------------------------------ */

type Persisted = StorageValue<AppData>;

const io = {
  status: 'pending' as 'pending' | 'empty' | 'ok' | 'error',
  /** Raw text of the last read, kept so it can be exported or backed up after a failed load. */
  raw: null as string | null,
  writable: false,
  pending: null as { name: string; value: Persisted } | null,
  timer: null as ReturnType<typeof setTimeout> | null,
};

function writeNow() {
  if (io.timer) clearTimeout(io.timer);
  io.timer = null;
  const job = io.pending;
  io.pending = null;
  if (!job || !io.writable) return;
  AsyncStorage.setItem(job.name, JSON.stringify(job.value)).catch((e) => console.warn('BrightPath: could not save', e));
}

/** Writes any batched change straight away (e.g. when the app goes to the background). */
export function flushPendingWrites() {
  writeNow();
}

const storage: PersistStorage<AppData> = {
  getItem: async (name) => {
    io.status = 'pending';
    io.raw = null;
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(name);
    } catch (e) {
      io.status = 'error';
      throw e;
    }
    io.raw = raw;
    if (raw == null) {
      io.status = 'empty';
      return null;
    }
    try {
      const value = JSON.parse(raw) as Persisted;
      io.status = 'ok';
      return value;
    } catch (e) {
      io.status = 'error';
      throw e;
    }
  },
  setItem: (name, value) => {
    if (!io.writable) return;
    io.pending = { name, value };
    if (io.timer) clearTimeout(io.timer);
    io.timer = setTimeout(writeNow, WRITE_DEBOUNCE_MS);
  },
  removeItem: (name) => AsyncStorage.removeItem(name),
};

try {
  NativeAppState.addEventListener?.('change', (next) => {
    if (next !== 'active') writeNow();
  });
} catch {
  // AppState is unavailable in some test and server environments.
}

const talkOf = (s: AppData, learnerId: string): TalkPrefs => s.talk?.[learnerId] ?? DEFAULT_TALK;

const localDay = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      initialized: false,
      hydrated: false,
      loadError: null,

      seedDemo: (now) => set({ ...demoData(now) }),
      deleteAllData: () => {
        // An explicit reset is the one way to write over data that failed to load.
        io.writable = true;
        set({ ...emptyData(), loadError: null });
      },
      exportData: () => {
        const s = get();
        if (s.loadError && io.raw != null) return io.raw;
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
        const fx = sessionEffects(readiness);
        set((s) => ({
          session: { ...s.session, feeling, readiness, startedAt: new Date().toISOString(), quiet: fx.quiet, gentle: fx.gentle },
        }));
        return readiness;
      },
      setQuiet: (quiet) => set((s) => ({ session: { ...s.session, quiet } })),
      resetSession: () => set({ session: { quiet: false } }),

      recordObservation: (input) => {
        let delayDays = input.delayDays;
        if (delayDays === undefined && input.goalId) {
          // Days since this goal was last practised, so later tries count as Remember probes.
          const t = new Date(input.at).getTime();
          const prev = get()
            .observations.filter((x) => x.goalId === input.goalId && x.quality === 'valid' && new Date(x.at).getTime() < t)
            .reduce<number | undefined>((m, x) => Math.max(m ?? 0, new Date(x.at).getTime()), undefined);
          if (prev !== undefined) delayDays = Math.floor((t - prev) / DAY_MS);
        }
        const o: Observation = {
          quality: input.outcome === 'accessLimited' ? 'accessLimited' : 'valid',
          tools: [],
          tags: [],
          ...input,
          ...(delayDays !== undefined ? { delayDays } : null),
          id: uid('obs'),
          versions: { content: VERSIONS.content, logic: VERSIONS.decisionLogic, evidence: VERSIONS.evidenceSchema },
        };
        set((s) => {
          const observations = [...s.observations, o];
          if (!o.goalId) return { observations };
          const goals = s.goals.map((g) => {
            if (g.id !== o.goalId) return g;
            let next: GrowthGoal = { ...g };
            // One spacing step per session: several tries in a row are not several days of remembering.
            const lastAt = g.spaced.lastAt ? new Date(g.spaced.lastAt).getTime() : undefined;
            if (o.quality !== 'invalid' && (lastAt === undefined || new Date(o.at).getTime() - lastAt > HOUR_MS)) {
              next.spaced = schedule(g.spaced, o.outcome, new Date(o.at));
            }
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
                      // Never earlier than the observation that caused it (prompts.ts compares these).
                      at: new Date(Math.max(Date.now(), new Date(o.at).getTime() || 0)).toISOString(),
                      kind: change.direction === 'reduce' ? 'fade' : change.direction === 'restore' ? 'restore' : 'increase',
                      from: change.from,
                      to: change.to,
                      reason: change.reason,
                      atValidCount: validCount,
                      ...(change.temporary ? { temporary: true } : null),
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
      annotateObservation: (id, patch) =>
        set((s) => ({
          observations: s.observations.map((o) => {
            if (o.id !== id) return o;
            const add = patch.note?.trim();
            const note = add ? (o.note ? `${o.note}\n${add}` : add) : o.note;
            const tags = patch.tags ? [...new Set([...o.tags, ...patch.tags])] : o.tags;
            return { ...o, note, tags };
          }),
        })),
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
      abandonRun: (runId) =>
        set((s) => ({ runs: s.runs.map((r) => (r.id === runId && !r.completedAt && !r.abandonedAt ? { ...r, abandonedAt: new Date().toISOString() } : r)) })),
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
        set((s) =>
          q.runId && s.quests.some((x) => x.runId === q.runId)
            ? {}
            : { quests: [...s.quests, { ...q, id: uid('quest'), learnerId: s.activeLearnerId, acceptedAt: new Date().toISOString(), status: 'open' }] },
        ),
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

      updateTalk: (learnerId, patch) =>
        set((s) => {
          const t = { ...talkOf(s, learnerId), ...patch };
          if (!t.keepRecents) t.recents = [];
          return { talk: { ...s.talk, [learnerId]: t } };
        }),
      noteTalkUse: (learnerId, cardId) =>
        set((s) => {
          const t = talkOf(s, learnerId);
          if (!t.keepRecents || t.recents[0] === cardId) return {};
          return { talk: { ...s.talk, [learnerId]: { ...t, recents: withRecent(t.recents, cardId) } } };
        }),
      clearTalkRecents: (learnerId) => set((s) => ({ talk: { ...s.talk, [learnerId]: { ...talkOf(s, learnerId), recents: [] } } })),
      addTalkCard: (learnerId, card) => {
        const t = talkOf(get(), learnerId);
        if (t.custom.length >= MAX_CUSTOM_CARDS) return null;
        const id = `${CUSTOM_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        set((s) => {
          const cur = talkOf(s, learnerId);
          return { talk: { ...s.talk, [learnerId]: { ...cur, custom: [...cur.custom, { ...card, id }] } } };
        });
        return id;
      },
      updateTalkCard: (learnerId, id, patch) =>
        set((s) => {
          const t = talkOf(s, learnerId);
          return { talk: { ...s.talk, [learnerId]: { ...t, custom: t.custom.map((c) => (c.id === id ? { ...c, ...patch } : c)) } } };
        }),
      removeTalkCard: (learnerId, id) =>
        set((s) => {
          const t = talkOf(s, learnerId);
          return {
            talk: { ...s.talk, [learnerId]: { ...t, custom: t.custom.filter((c) => c.id !== id), recents: t.recents.filter((r) => r !== id) } },
          };
        }),
      retryLoad: async () => {
        set({ loadError: null, hydrated: false });
        await useApp.persist.rehydrate();
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      migrate: (persisted, fromVersion) => migrateStore(persisted as Partial<AppData>, fromVersion) as AppState,
      storage,
      partialize: (s) => {
        const out: Partial<AppData> = {};
        for (const k of DATA_KEYS) (out as Record<string, unknown>)[k] = s[k];
        return out as AppData;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Keep the family's data safe: no demo seed, no writes, a raw backup, and a flag the UI can act on.
          console.warn('BrightPath: could not restore saved data', error);
          io.writable = false;
          io.pending = null;
          const raw = io.raw;
          const message = error instanceof Error ? error.message : String(error);
          useApp.setState({ hydrated: true, loadError: { message, backedUp: false } });
          // Only report a backup once it has actually been written.
          if (raw != null)
            AsyncStorage.setItem(BACKUP_KEY, raw)
              .then(() => {
                if (useApp.getState().loadError) useApp.setState({ loadError: { message, backedUp: true } });
              })
              .catch((e) => console.warn('BrightPath: could not back up unreadable data', e));
          return;
        }
        io.writable = true;
        const s = useApp.getState();
        if (io.status === 'empty' && !s.initialized) s.seedDemo();
        else if (!s.initialized) useApp.setState({ initialized: true });
        // A check-in belongs to the day it was made.
        const started = useApp.getState().session.startedAt;
        if (!started || localDay(new Date(started)) !== localDay(new Date())) useApp.setState({ session: { quiet: false } });
        useApp.setState({ hydrated: true, loadError: null });
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

/** A learner's Talk board settings (defaults until an adult changes them). */
export function useTalkPrefs(learnerId: string): TalkPrefs {
  return useApp((s) => talkOf(s, learnerId));
}

export function useRewards(): Rewards {
  return useApp((s) => s.rewards[s.activeLearnerId] ?? EMPTY_REWARDS);
}

export function badgeInfo(id: Badge['id']) {
  return BADGES[id];
}

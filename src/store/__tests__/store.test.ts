import { GUIDE } from '@/content/cast';
import { summarize } from '@/engine/evidence';
import type { Learner } from '@/engine/types';

import { DEFAULT_ACCESS } from '../defaults';
import { migrateStore, STORE_VERSION } from '../migrations';
import { MAX_RECENTS } from '../talk';

type Store = typeof import('../index');
type Storage = { getItem: jest.Mock; setItem: jest.Mock; removeItem: jest.Mock };

const realSetImmediate: (cb: () => void) => void = jest.requireActual('timers').setImmediate;
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise<void>((r) => realSetImmediate(r));
};

/** Loads a fresh copy of the store against a mocked AsyncStorage and waits for hydration. */
async function load(getItem: () => Promise<string | null>): Promise<{ store: Store; storage: Storage }> {
  const storage: Storage = { getItem: jest.fn(getItem), setItem: jest.fn(() => Promise.resolve()), removeItem: jest.fn(() => Promise.resolve()) };
  let store!: Store;
  jest.isolateModules(() => {
    jest.doMock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: storage }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a synchronous load
    store = require('../index');
  });
  await flush();
  return { store, storage };
}

const writesTo = (storage: Storage, key: string) => storage.setItem.mock.calls.filter(([k]) => k === key);

beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }));
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('loading saved data', () => {
  it('a failed read never seeds demo data and never writes', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { store, storage } = await load(() => Promise.reject(new Error('disk busy')));
    const s = store.useApp.getState();
    expect(storage.getItem).toHaveBeenCalledWith('brightpath-v2');
    expect(s.hydrated).toBe(true);
    expect(s.loadError).toMatchObject({ message: 'disk busy', backedUp: false });
    expect(s.demoData).toBe(false);
    s.setAdultName('Sam');
    jest.advanceTimersByTime(2000);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('unreadable data is backed up and not overwritten', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { store, storage } = await load(() => Promise.resolve('{not json'));
    expect(store.useApp.getState().loadError?.backedUp).toBe(true);
    expect(writesTo(storage, store.BACKUP_KEY)).toEqual([[store.BACKUP_KEY, '{not json']]);
    expect(store.useApp.getState().exportData()).toBe('{not json');
    store.useApp.getState().setAdultName('Sam');
    jest.advanceTimersByTime(2000);
    expect(writesTo(storage, 'brightpath-v2')).toHaveLength(0);
  });

  it('seeds the demo only when nothing is stored, and batches writes', async () => {
    const { store, storage } = await load(() => Promise.resolve(null));
    const s = store.useApp.getState();
    expect(s.demoData).toBe(true);
    expect(s.loadError).toBeNull();
    s.setAdultName('A');
    s.setAdultName('B');
    expect(writesTo(storage, 'brightpath-v2')).toHaveLength(0);
    jest.advanceTimersByTime(600);
    const writes = writesTo(storage, 'brightpath-v2');
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0][1]).state.adultName).toBe('B');
  });

  it('keeps stored family data and clears a check-in from another day', async () => {
    const yesterday = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
    const saved = { state: { initialized: true, demoData: false, adultName: 'Robin', session: { quiet: true, feeling: 'tired', startedAt: yesterday } }, version: STORE_VERSION };
    const { store } = await load(() => Promise.resolve(JSON.stringify(saved)));
    const s = store.useApp.getState();
    expect(s.adultName).toBe('Robin');
    expect(s.demoData).toBe(false);
    expect(s.session).toEqual({ quiet: false });
  });
});

describe('store actions', () => {
  async function ready() {
    const { store } = await load(() => Promise.resolve(null));
    return store.useApp;
  }

  it('awards stars once when a mission is finished twice', async () => {
    const app = await ready();
    const before = app.getState().rewards[app.getState().activeLearnerId]?.stars ?? 0;
    const runId = app.getState().startMission('be-kind-home');
    const first = app.getState().finishMission(runId);
    const second = app.getState().finishMission(runId);
    expect(first.stars).toBeGreaterThan(0);
    expect(second).toEqual({ stars: 0 });
    expect(app.getState().rewards[app.getState().activeLearnerId].stars).toBe(before + first.stars);
  });

  it('accepts a quest once per run and marks abandoned runs', async () => {
    const app = await ready();
    const runId = app.getState().startMission('be-kind-home');
    const q = { runId, missionId: 'be-kind-home', title: 'Kind words', quest: 'Say something kind', setting: 'home' as const, skillArea: 'social' as const };
    const n = app.getState().quests.length;
    app.getState().acceptQuest(q);
    app.getState().acceptQuest(q);
    expect(app.getState().quests).toHaveLength(n + 1);

    const other = app.getState().startMission('be-kind-home');
    app.getState().abandonRun(other);
    app.getState().abandonRun(runId);
    expect(app.getState().runs.find((r) => r.id === other)?.abandonedAt).toBeDefined();
    app.getState().finishMission(runId);
    app.getState().abandonRun(runId);
    expect(app.getState().runs.find((r) => r.id === runId)?.abandonedAt).toBeDefined();
    const done = app.getState().startMission('be-kind-home');
    app.getState().finishMission(done);
    app.getState().abandonRun(done);
    expect(app.getState().runs.find((r) => r.id === done)?.abandonedAt).toBeUndefined();
  });

  it('annotates an observation without touching goals', async () => {
    const app = await ready();
    const o = app.getState().observations.find((x) => x.goalId)!;
    const goals = app.getState().goals;
    app.getState().annotateObservation(o.id, { note: 'Used the picture card', tags: ['aac', ...o.tags] });
    const after = app.getState().observations.find((x) => x.id === o.id)!;
    expect(after.note).toContain('Used the picture card');
    expect(after.tags).toEqual([...new Set([...o.tags, 'aac'])]);
    expect(app.getState().goals).toBe(goals);
  });

  it('stores the gentle flag and resets the session', async () => {
    const app = await ready();
    app.getState().checkIn('tired');
    expect(app.getState().session).toMatchObject({ readiness: 'needBreak', quiet: true, gentle: true });
    app.getState().resetSession();
    expect(app.getState().session).toEqual({ quiet: false });
  });

  it('records delayDays so a success days later counts as a Remember probe', async () => {
    const app = await ready();
    const goalId = app.getState().addGoal({ ...app.getState().goals[0], status: 'active', supportLocked: true });
    const learnerId = app.getState().activeLearnerId;
    const base = { learnerId, goalId, skillArea: 'communication' as const, source: 'home' as const, context: { setting: 'home' as const }, supportLevel: 2 as const };
    const t0 = new Date('2026-09-01T10:00:00Z');
    app.getState().recordObservation({ ...base, outcome: 'independent', at: t0.toISOString() });
    const before = summarize(app.getState().observations.filter((o) => o.goalId === goalId)).retention.probes;
    const later = app.getState().recordObservation({ ...base, outcome: 'independent', at: new Date(t0.getTime() + 2 * 86400000 + 3600000).toISOString() });
    expect(later.delayDays).toBe(2);
    expect(summarize(app.getState().observations.filter((o) => o.goalId === goalId)).retention.probes).toBe(before + 1);
  });

  it('advances spaced practice once per session', async () => {
    const app = await ready();
    const goalId = app.getState().addGoal({ ...app.getState().goals[0], status: 'active' });
    const learnerId = app.getState().activeLearnerId;
    const t0 = new Date('2026-09-01T10:00:00Z').getTime();
    for (let i = 0; i < 3; i += 1) {
      app.getState().recordObservation({ learnerId, goalId, skillArea: 'communication', source: 'app', context: { setting: 'app' }, supportLevel: 2, outcome: 'independent', at: new Date(t0 + i * 60000).toISOString() });
    }
    expect(app.getState().goals.find((g) => g.id === goalId)?.spaced.index).toBe(1);
  });

  it('keeps Talk settings, own words and recent words per learner', async () => {
    const app = await ready();
    const id = app.getState().activeLearnerId;
    const talk = () => app.getState().talk[id];
    app.getState().updateTalk(id, { columns: 3, speakOnTap: false });
    expect(talk()).toMatchObject({ columns: 3, speakOnTap: false, showWords: true });
    for (const c of ['snacks.cookie', 'core.want']) app.getState().noteTalkUse(id, c);
    expect(talk().recents.slice(0, 2)).toEqual(['core.want', 'snacks.cookie']);
    const cardId = app.getState().addTalkCard(id, { label: 'Grandma', say: 'Grandma', cls: 'people', symbol: 'old-woman' });
    expect(cardId).toMatch(/^mine\./);
    app.getState().noteTalkUse(id, cardId!);
    app.getState().removeTalkCard(id, cardId!);
    expect(talk().custom.some((c) => c.id === cardId)).toBe(false);
    expect(talk().recents).not.toContain(cardId);
    app.getState().updateTalk(id, { keepRecents: false });
    expect(talk().recents).toEqual([]);
    app.getState().noteTalkUse(id, 'core.more');
    expect(talk().recents).toEqual([]);
  });

  it('caps recent words, exports Talk data and deletes it with everything else', async () => {
    const app = await ready();
    const id = app.getState().activeLearnerId;
    for (let i = 0; i < 20; i += 1) app.getState().noteTalkUse(id, `core.word-${i}`);
    expect(app.getState().talk[id].recents).toHaveLength(MAX_RECENTS);
    expect(JSON.parse(app.getState().exportData()).talk[id].recents).toHaveLength(MAX_RECENTS);
    app.getState().deleteAllData();
    expect(app.getState().talk).toEqual({});
  });

  it('never records Talk board use as evidence', async () => {
    const app = await ready();
    const before = app.getState().observations.length;
    app.getState().noteTalkUse(app.getState().activeLearnerId, 'quick.help-me');
    expect(app.getState().observations).toHaveLength(before);
  });

  it('defaults photo consent to off for a fresh start', async () => {
    const app = await ready();
    app.getState().deleteAllData();
    expect(app.getState().consent.photos).toBe(false);
  });
});

describe('v4 migration', () => {
  it('fills access settings added after the profile was saved, keeping saved choices', () => {
    const old = { id: 'l1', displayName: 'Sam', buddy: GUIDE.id, access: { presentation: 'iconFirst', sensory: { music: true } } } as unknown as Learner;
    const out = migrateStore({ learners: [old] }, 3);
    const a = out.learners![0].access;
    expect(a.presentation).toBe('iconFirst');
    expect(a.sensory.music).toBe(true);
    expect(a.sensory.backgroundMotion).toBe(DEFAULT_ACCESS.sensory.backgroundMotion);
    expect(a.motor).toEqual(DEFAULT_ACCESS.motor);
    expect(a.communication).toEqual(DEFAULT_ACCESS.communication);
  });
});

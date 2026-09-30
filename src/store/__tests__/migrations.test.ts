import { GUIDE } from '@/content/cast';
import type { Learner } from '@/engine/types';

import { migrateStore } from '../migrations';
import { DEMO_CHILD_ID, demoTalk } from '../seed';
import { DEFAULT_TALK, resolveCard, type TalkPrefs } from '../talk';

const learner = (buddy: string) => ({ id: `l-${buddy}`, displayName: 'Test', buddy }) as unknown as Learner;

describe('store migrations', () => {
  it('keeps the fox for learners who chose it before the rename', () => {
    const out = migrateStore({ learners: [learner('finn'), learner('pip')] }, 2);
    expect(out.learners?.map((l) => l.buddy)).toEqual([GUIDE.id, 'pip']);
  });

  it('leaves current data untouched', () => {
    const data = { learners: [learner(GUIDE.id)] };
    expect(migrateStore(data, 3)).toBe(data);
  });

  it('tolerates data without learners', () => {
    expect(migrateStore({}, 1)).toEqual({});
  });

  it('renames the demo child to Gabriel in demo data only', () => {
    const demo = {
      demoData: true,
      activeLearnerId: 'learner-alex',
      learners: [{ id: 'learner-alex', displayName: 'Alex', fullName: 'Alex Rivera', buddy: GUIDE.id }, { id: 'learner-maya', displayName: 'Maya', buddy: 'pip' }] as unknown as Learner[],
      goals: [{ id: 'g1', learnerId: 'learner-alex', notes: 'Alex is learning to pause.' }],
      rewards: { 'learner-alex': { stars: 12 } },
      plans: [{ id: 'plan-alex-1', learnerId: 'learner-alex' }],
    };
    const out = migrateStore(demo, 4) as typeof demo;
    expect(out.activeLearnerId).toBe('learner-gabriel');
    expect(out.learners.map((l) => [l.id, l.displayName, l.fullName])).toEqual([
      ['learner-gabriel', 'Gabriel', 'Gabriel Rivera'],
      ['learner-maya', 'Maya', undefined],
    ]);
    expect(out.goals[0]).toEqual({ id: 'g1', learnerId: 'learner-gabriel', notes: 'Gabriel is learning to pause.' });
    expect(Object.keys(out.rewards)).toEqual(['learner-gabriel']);
    expect(out.plans[0].id).toBe('plan-gabriel-1');
  });

  it('never renames a real family’s child', () => {
    const real = { demoData: false, learners: [{ id: 'learner-alex', displayName: 'Alex', buddy: GUIDE.id }] as unknown as Learner[] };
    expect(migrateStore(real, 4)).toBe(real);
  });

  it('does not rename again once migrated', () => {
    const demo = { demoData: true, learners: [{ id: 'learner-x', displayName: 'Alex', buddy: GUIDE.id }] as unknown as Learner[] };
    expect(migrateStore(demo, 5).learners).toBe(demo.learners);
  });

  it('gives demo data Gabriel’s own Talk words, and leaves real families at the defaults', () => {
    type Saved = { demoData: boolean; learners?: Learner[]; talk?: Record<string, TalkPrefs> };
    const demo = migrateStore<Saved>({ demoData: true, learners: [] }, 5);
    expect(demo.talk?.[DEMO_CHILD_ID]?.custom.length).toBeGreaterThan(0);
    expect(migrateStore<Saved>({ demoData: false, learners: [] }, 5).talk).toBeUndefined();
    const saved: Saved = { demoData: true, talk: { [DEMO_CHILD_ID]: { ...DEFAULT_TALK, columns: 5 } } };
    expect(migrateStore(saved, 5).talk?.[DEMO_CHILD_ID]?.columns).toBe(5);
  });

  it('seeds demo Talk words whose recent cards all exist', () => {
    const t = demoTalk();
    for (const id of t.recents) expect(resolveCard(id, t.custom)).toBeDefined();
    expect(new Set(t.custom.map((c) => c.id)).size).toBe(t.custom.length);
  });
});

import { recommend } from '../decision';
import { suggestSupportChange, supportForMode } from '../prompts';
import type { GrowthGoal, Observation } from '../types';
import { day, goal, obs } from '../__fixtures__/helpers';

/** Feeds observations one by one and applies each suggested change, like the store does. */
function play(start: GrowthGoal, xs: Observation[]): { g: GrowthGoal; seen: Observation[] } {
  let g = start;
  const seen: Observation[] = [];
  for (const o of xs) {
    seen.push(o);
    const change = suggestSupportChange(g, seen);
    if (!change) continue;
    const kind = change.direction === 'reduce' ? 'fade' : change.direction;
    const atValidCount = seen.filter((x) => x.quality === 'valid' && x.outcome !== 'accessLimited').length;
    g = { ...g, supportLevel: change.to, adaptations: [...g.adaptations, { at: o.at, kind, from: change.from, to: change.to, reason: change.reason, atValidCount, temporary: change.temporary }] };
  }
  return { g, seen };
}

describe('Prompt fading (Framework §13)', () => {
  it('fades one step after three successful valid opportunities', () => {
    const xs = Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 3, at: day(1, 9 + i) }));
    expect(suggestSupportChange(goal({ supportLevel: 3 }), xs)).toMatchObject({ direction: 'reduce', from: 3, to: 2 });
  });

  it('respects the adaptation rate limit', () => {
    const xs = Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 2, at: day(1, 9 + i) }));
    const g = goal({ supportLevel: 2, adaptations: [{ at: day(1, 12), kind: 'fade', from: 3, to: 2, reason: '', atValidCount: 3 }] });
    expect(suggestSupportChange(g, xs)).toBeNull();
  });

  it('restores the previous level after two misses following a fade', () => {
    const xs = [
      ...Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 3, at: day(1, 9 + i) })),
      obs({ outcome: 'notDemonstrated', supportLevel: 2, at: day(2, 9) }),
      obs({ outcome: 'partial', supportLevel: 2, at: day(2, 10) }),
    ];
    const g = goal({ supportLevel: 2, adaptations: [{ at: day(1, 12), kind: 'fade', from: 3, to: 2, reason: '', atValidCount: 3 }] });
    expect(suggestSupportChange(g, xs)).toMatchObject({ direction: 'restore', to: 3 });
  });

  it('raises support temporarily in a new context', () => {
    const xs = [obs({ outcome: 'supported', supportLevel: 2, context: { setting: 'school', novelty: 'new' }, at: day(3) })];
    expect(suggestSupportChange(goal({ supportLevel: 2 }), xs)?.direction).toBe('increase');
  });

  it('raises support once for a help request, then settles back after two successes', () => {
    const xs = [
      obs({ outcome: 'supported', supportLevel: 3, tools: ['help'], at: day(1, 9) }),
      ...Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 3, at: day(1, 10 + i) })),
    ];
    const { g, seen } = play(goal({ supportLevel: 3, templateId: 'short-routine' }), xs);
    expect(g.adaptations.filter((a) => a.kind === 'increase')).toHaveLength(1);
    expect(g.adaptations.every((a) => a.temporary)).toBe(true);
    expect(g.supportLevel).toBeLessThanOrEqual(4);
    expect(g.supportLevel).toBe(3);
    expect(recommend(g, seen, new Date(day(2))).kind).not.toBe('humanReview');
  });

  it('does not stack help bumps while one is active', () => {
    const xs = Array.from({ length: 4 }, (_, i) => obs({ outcome: 'supported', supportLevel: 4, tools: ['moreTime'], at: day(1, 9 + i) }));
    const { g } = play(goal({ supportLevel: 3, templateId: 'short-routine' }), xs);
    expect(g.supportLevel).toBe(4);
  });

  it('never raises support because the learner asked for help on the help goal', () => {
    const xs = [obs({ outcome: 'independent', supportLevel: 3, tools: ['help'], at: day(1, 9) })];
    expect(suggestSupportChange(goal({ supportLevel: 3, templateId: 'request-help' }), xs)).toBeNull();
  });

  it('suggests nothing when adults locked the support level', () => {
    const xs = Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 3, at: day(1, 9 + i) }));
    expect(suggestSupportChange(goal({ supportLevel: 3, supportLocked: true }), xs)).toBeNull();
  });

  it('maps journey modes to default in-app support', () => {
    expect(supportForMode('discover', 'B')).toBe(5);
    expect(supportForMode('remember', 'C')).toBe(1);
    expect(supportForMode('practice', 'A')).toBe(4);
  });
});

import { recommend, HEURISTICS } from '../decision';
import { day, goal, obs } from '../__fixtures__/helpers';

const NOW = new Date(Date.UTC(2026, 8, 29, 12));

describe('Decision Rules (Framework Part III)', () => {
  it('asks to review the goal when it is not observable', () => {
    const r = recommend(goal({ observableAction: '' }), [], NOW);
    expect(r.kind).toBe('reviewGoal');
    expect(r.pauseAdaptation).toBe(true);
  });

  it('gathers more evidence below the evidence floor, with a provisional mode', () => {
    const r = recommend(goal(), [obs({ outcome: 'partial', at: day(1) }), obs({ outcome: 'supported', supportLevel: 5, at: day(2) })], NOW);
    expect(r.kind).toBe('gatherEvidence');
    expect(r.mode).toBe('discover');
    expect(r.reasons.join(' ')).toMatch(/provisional/);
  });

  it('never treats access-limited opportunities as failure and reassesses access', () => {
    const many = Array.from({ length: 6 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(1, 8 + i) }));
    const limited = Array.from({ length: 3 }, (_, i) =>
      obs({ outcome: 'accessLimited', quality: 'accessLimited', at: day(5, 9 + i) }),
    );
    const r = recommend(goal(), [...many, ...limited], NOW);
    expect(r.kind).toBe('reassessAccess');
    expect(r.summary.validCount).toBe(6);
    expect(r.summary.counts.notDemonstrated).toBe(0);
  });

  it('routes to Discover when no full demonstration exists', () => {
    const xs = Array.from({ length: 7 }, (_, i) => obs({ outcome: i % 2 ? 'partial' : 'supported', supportLevel: 6, at: day(i % 3, 9 + i) }));
    expect(recommend(goal(), xs, NOW).kind).toBe('discover');
  });

  it('routes to Practice when low-support success is below the routing default', () => {
    const xs = [
      ...Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(1, 9 + i) })),
      ...Array.from({ length: 5 }, (_, i) => obs({ outcome: 'notDemonstrated', at: day(2, 9 + i) })),
    ];
    const r = recommend(goal({ supportLevel: 5 }), xs, NOW);
    expect(r.mode).toBe('practice');
    expect(r.summary.lowSupportRate).toBeLessThan(HEURISTICS.reliableRate);
  });

  it('routes to Explore when reliable but evidence is narrow', () => {
    const xs = Array.from({ length: 8 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(i % 2 ? 1 : 3, 9 + i) }));
    const r = recommend(goal({ supportLevel: 1 }), xs, NOW);
    expect(r.mode).toBe('explore');
    expect(r.tools).toContain('changePlace');
  });

  it('routes to Remember when reliable across contexts but retention is unknown', () => {
    const xs = [
      ...Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(1, 9 + i) })),
      ...Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, source: 'home', context: { setting: 'home' }, at: day(3, 9 + i) })),
    ];
    expect(recommend(goal({ supportLevel: 1 }), xs, NOW).mode).toBe('remember');
  });

  it('recommends Maintain with retention and real-world use', () => {
    const xs = [
      ...Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(1, 9 + i) })),
      ...Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, source: 'home', context: { setting: 'home' }, realWorld: true, at: day(4, 9 + i) })),
      obs({ outcome: 'independent', supportLevel: 1, source: 'school', context: { setting: 'school' }, delayDays: 7, at: day(12) }),
      obs({ outcome: 'independent', supportLevel: 1, source: 'school', context: { setting: 'school' }, delayDays: 3, at: day(15) }),
    ];
    const r = recommend(goal({ supportLevel: 1 }), xs, NOW);
    expect(r.kind).toBe('maintain');
  });

  it('pauses adaptation and asks for a human when the learner repeatedly stops', () => {
    const xs = Array.from({ length: 8 }, (_, i) => obs({ outcome: 'partial', tools: i < 4 ? ['stop'] : [], at: day(20 + (i % 2), 9 + i) }));
    const r = recommend(goal(), xs, NOW);
    expect(r.kind).toBe('humanReview');
    expect(r.pauseAdaptation).toBe(true);
    expect(r.reasons[0]).toMatch(/human review/i);
  });

  it('flags strongly conflicting evidence sources', () => {
    const xs = [
      ...Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, source: 'home', context: { setting: 'home' }, at: day(22, 9 + i) })),
      ...Array.from({ length: 4 }, (_, i) => obs({ outcome: 'notDemonstrated', source: 'school', context: { setting: 'school' }, at: day(23, 9 + i) })),
    ];
    expect(recommend(goal(), xs, NOW).humanReviewTriggers.join(' ')).toMatch(/conflict/);
  });

  it('temporarily increases support when help is requested (not a regression)', () => {
    const xs = [
      ...Array.from({ length: 6 }, (_, i) => obs({ outcome: 'independent', supportLevel: 2, at: day(1, 9 + i) })),
      obs({ outcome: 'supported', supportLevel: 3, tools: ['help'], at: day(2) }),
    ];
    const r = recommend(goal({ supportLevel: 2 }), xs, NOW);
    expect(r.kind).toBe('increaseSupport');
    expect(r.supportChange?.direction).toBe('increase');
    expect(r.reasons[0]).toMatch(/not a setback/);
  });
});

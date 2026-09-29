import { suggestSupportChange, supportForMode } from '../prompts';
import { day, goal, obs } from '../__fixtures__/helpers';

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

  it('maps journey modes to default in-app support', () => {
    expect(supportForMode('discover', 'B')).toBe(5);
    expect(supportForMode('remember', 'C')).toBe(1);
    expect(supportForMode('practice', 'A')).toBe(4);
  });
});

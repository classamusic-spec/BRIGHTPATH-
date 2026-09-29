import { contextMatrix } from '../context';
import { confidenceOf, dimensionScores, journeyProgress, summarize } from '../evidence';
import { day, obs } from '../__fixtures__/helpers';

describe('Evidence Engine', () => {
  it('uses valid accessible opportunities as the reliability denominator', () => {
    const s = summarize([
      obs({ outcome: 'independent', supportLevel: 1, at: day(1) }),
      obs({ outcome: 'accessLimited', quality: 'accessLimited', at: day(1, 11) }),
      obs({ outcome: 'notDemonstrated', quality: 'invalid', at: day(1, 12) }),
    ]);
    expect(s.validCount).toBe(1);
    expect(s.successRate).toBe(1);
    expect(s.accessLimited).toHaveLength(1);
    expect(s.invalid).toHaveLength(1);
  });

  it('labels confidence honestly', () => {
    expect(confidenceOf(4, 3)).toBe('early');
    expect(confidenceOf(8, 2)).toBe('developing');
    expect(confidenceOf(14, 3)).toBe('established');
    expect(confidenceOf(30, 1)).toBe('early');
  });

  it('keeps dimensions independent and progress within 0..1', () => {
    const s = summarize(Array.from({ length: 6 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(i) })));
    const d = dimensionScores(s);
    expect(d.emergence).toBe(1);
    expect(d.retention).toBe(0);
    expect(d.functionalUse).toBe(0);
    const p = journeyProgress(s);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it('shows "not enough evidence" instead of guessing in the context matrix', () => {
    const m = contextMatrix([obs({ outcome: 'independent', supportLevel: 1, context: { setting: 'home' }, at: day(1) })]);
    expect(m[0][0].status).toBe('none');
    const m2 = contextMatrix(Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, context: { setting: 'home' }, at: day(i) })));
    expect(m2[0][0].status).toBe('strong');
    expect(m2[0][0].observationIds).toHaveLength(4);
  });
});

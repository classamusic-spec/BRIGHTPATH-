import { INTERVALS, nextIndex, schedule } from '../spaced';

describe('Spaced practice (Framework §39)', () => {
  it('lengthens after independent retrieval', () => expect(nextIndex(3, 'independent')).toBe(4));
  it('maintains or modestly lengthens after supported retrieval', () => {
    expect(nextIndex(1, 'supported')).toBe(2);
    expect(nextIndex(5, 'supported')).toBe(5);
  });
  it('shortens after a miss', () => expect(nextIndex(4, 'notDemonstrated')).toBe(3));
  it('reschedules access-limited without regression', () => {
    expect(nextIndex(4, 'accessLimited')).toBe(4);
    const now = new Date('2026-09-01T10:00:00Z');
    const s = schedule({ index: 6 }, 'accessLimited', now);
    expect(s.index).toBe(6);
    expect(new Date(s.nextDue!).getTime() - now.getTime()).toBeLessThanOrEqual(16 * 3600 * 1000);
  });
  it('never exceeds the longest interval', () => expect(nextIndex(INTERVALS.length - 1, 'independent')).toBe(INTERVALS.length - 1));
});

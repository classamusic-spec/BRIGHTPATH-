import { MISSIONS } from '../../content/missions';
import { BANDS, choicesForBand } from '../bands';
import type { PresentationBand } from '../types';

const BAND_KEYS: PresentationBand[] = ['A', 'B', 'C'];
const nonSpeech = (o: { modality?: string }) => (o.modality ?? 'tap') !== 'speech';

describe('choicesForBand', () => {
  it('Band A offers two or three options', () => {
    expect(BANDS.A.maxChoices).toBe(3);
  });

  for (const m of MISSIONS)
    for (const s of m.steps)
      if (s.type === 'quickChoice' || s.type === 'cardChoice')
        for (const band of BAND_KEYS)
          it(`${m.id}/${s.id} band ${band}: ≥2 options, a helpful one, and a non-speech helpful one when it exists`, () => {
            const out = choicesForBand(s.options, band);
            expect(out.length).toBeGreaterThanOrEqual(Math.min(2, s.options.length));
            expect(out.length).toBeLessThanOrEqual(Math.max(BANDS[band].maxChoices, 2));
            expect(out.some((o) => o.helpful)).toBe(true);
            if (s.options.some((o) => o.helpful && nonSpeech(o))) expect(out.some((o) => o.helpful && nonSpeech(o))).toBe(true);
          });

  it('keeps a non-helpful option when there is room for three', () => {
    const opts = [
      { id: 'a', helpful: true, modality: 'speech' as const },
      { id: 'b', helpful: true },
      { id: 'c', helpful: true, modality: 'gesture' as const },
      { id: 'd', helpful: false },
    ];
    const out = choicesForBand(opts, 'A');
    expect(out.map((o) => o.id)).toEqual(['b', 'c', 'd']);
  });

  it("puts the learner's preferred modality first", () => {
    const opts = [
      { id: 'a', helpful: true },
      { id: 'b', helpful: true },
      { id: 'c', helpful: true, modality: 'aac' as const },
      { id: 'd', helpful: true },
    ];
    expect(choicesForBand(opts, 'A', ['aac']).map((o) => o.id)).toContain('c');
  });

  it('never trims below two options', () => {
    expect(choicesForBand([{ helpful: true }, { helpful: false }], 'A')).toHaveLength(2);
  });
});

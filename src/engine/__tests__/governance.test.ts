import { checkAll, checkMission } from '../../content/governance';
import { MISSIONS } from '../../content/missions';

describe('Content governance (Framework Part XII)', () => {
  it('all starter missions pass automated checks', () => {
    expect(checkAll(MISSIONS)).toEqual([]);
  });

  it('never self-approves content', () => {
    for (const m of MISSIONS) expect(m.releaseStatus).not.toBe('approved');
  });

  it('rejects punitive language and speech-only missions', () => {
    const bad = { ...MISSIONS[0], modalities: ['speech' as const], summary: 'Wrong answer! You failed.' };
    const rules = checkMission(bad).map((i) => i.rule);
    expect(rules).toContain('multimodal');
    expect(rules).toContain('language');
  });

  it('every choice step offers at least one helpful option with gentle feedback', () => {
    for (const m of MISSIONS)
      for (const s of m.steps)
        if (s.type === 'quickChoice' || s.type === 'cardChoice') {
          expect(s.options.some((o) => o.helpful)).toBe(true);
          for (const o of s.options) expect(o.feedback.length).toBeGreaterThan(10);
        }
  });
});

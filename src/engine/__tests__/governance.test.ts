import { checkAll, checkMission } from '../../content/governance';
import { MISSIONS } from '../../content/missions';
import type { Mission, MissionStep } from '../../content/types';

const rulesFor = (m: Mission) => checkMission(m).map((i) => i.rule);

function withChoice(label: string, helpful: boolean): Mission {
  const m = MISSIONS.find((x) => x.id === 'pip-tower')!;
  const steps = m.steps.map((s): MissionStep =>
    s.type === 'quickChoice' && s.id === 'choice-2' ? { ...s, options: [...s.options, { id: 'extra', label, icon: 'clock', tone: 'sky', helpful, feedback: 'A gentle response for this option.' }] } : s,
  );
  return { ...m, steps };
}

describe('Content governance (Framework Part XII)', () => {
  it('all starter missions pass automated checks', () => {
    expect(checkAll(MISSIONS)).toEqual([]);
  });

  it('never self-approves content', () => {
    for (const m of MISSIONS) expect(m.releaseStatus).not.toBe('approved');
  });

  it('rejects punitive language and speech-only missions', () => {
    const bad = { ...MISSIONS[0], modalities: ['speech' as const], summary: 'Wrong answer! You failed.' };
    const rules = rulesFor(bad);
    expect(rules).toContain('multimodal');
    expect(rules).toContain('language');
  });

  it.each(['That was a failure.', 'You are failing.', 'Wrongly placed.', 'No tantrums here.', 'A meltdown story.', 'Being lazy.', 'A low functioning child.', 'high-functioning'])(
    'catches every form of avoided wording: %s',
    (summary) => {
      expect(rulesFor({ ...MISSIONS[0], summary })).toContain('language');
    },
  );

  it('does not flag harmless words that share letters', () => {
    expect(rulesFor({ ...MISSIONS[0], summary: 'A fair turn, a faithful friend and a written note.' })).not.toContain('language');
  });

  it('agency tools are never the unhelpful option', () => {
    for (const label of ['Take a break', 'Say stop', 'Say “All done”', 'Say “Not yet”']) expect(rulesFor(withChoice(label, false))).toContain('agency');
    expect(rulesFor(withChoice('Take a break', true))).not.toContain('agency');
  });

  it('review stages past framework review need recorded sign-offs', () => {
    const m = MISSIONS[0];
    expect(rulesFor({ ...m, reviewStatus: 'frameworkReview' })).not.toContain('review');
    expect(rulesFor({ ...m, reviewStatus: 'pilotReady', reviews: [] })).toContain('review');
    const signed = (['frameworkReview', 'agencyReview', 'accessibilityReview', 'editorialReview', 'qaReview'] as const).map((stage) => ({ stage, by: 'Reviewer', at: '2026-01-01' }));
    expect(rulesFor({ ...m, reviewStatus: 'pilotReady', reviews: signed })).not.toContain('review');
    expect(rulesFor({ ...m, reviewStatus: 'agencyReview', reviews: [signed[0]] })).not.toContain('review');
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

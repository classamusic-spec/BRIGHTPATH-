import { day, goal, obs } from '../__fixtures__/helpers';
import { keyInsights, progressReport, weeklySummary } from '../summary';

const NOW = new Date(Date.UTC(2026, 8, 29, 12));

describe('Coach summaries only claim what the data shows', () => {
  it('makes no positive claims without evidence', () => {
    const k = keyInsights('Alex', [], NOW);
    const text = k.map((i) => `${i.title} ${i.subtitle}`).join(' ');
    expect(text).not.toMatch(/Stronger|Growing|Fewer/);
    expect(k.every((i) => i.trend === 'unknown')).toBe(true);
    expect(k.every((i) => i.subtitle === 'Not enough evidence yet')).toBe(true);
  });

  it('uses the board wording only when the trend is up', () => {
    const xs = Array.from({ length: 4 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(20, 9 + i) }));
    const [comm] = keyInsights('Alex', xs, NOW);
    expect(comm.trend).toBe('up');
    expect(comm.title).toBe('Stronger communication');
    expect(comm.count).toBe(4);
  });

  it('does not count a goal with 3 observations as a skill growing', () => {
    const xs = Array.from({ length: 3 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(20, 9 + i) }));
    expect(progressReport([goal()], xs, '1M', NOW).skillsGrowing).toBe(0);
  });

  it('counts growth once per goal, not per dimension', () => {
    const xs = Array.from({ length: 10 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(20 + (i % 3), 9 + i) }));
    expect(progressReport([goal()], xs, '1M', NOW).skillsGrowing).toBe(1);
  });

  it('does not compare weeks without enough evidence and counts only goals with evidence', () => {
    const xs = [obs({ outcome: 'independent', at: day(23, 9) }), obs({ outcome: 'independent', at: day(16, 9) })];
    const w = weeklySummary('Alex', [goal(), goal({ id: 'g2' })], xs, new Date(Date.UTC(2026, 8, 23, 12)), NOW);
    expect(w.changedTrend).toBe('unknown');
    expect(w.narrative.changed).toMatch(/Not enough evidence/);
    expect(w.goals).toBe(1);
    expect(w.weekSoFar).toBe(false);
  });

  it('compares rates and prefixes the unfinished week', () => {
    const prev = Array.from({ length: 5 }, (_, i) => obs({ outcome: i < 1 ? 'independent' : 'notDemonstrated', supportLevel: 1, at: day(21, 9 + i) }));
    const cur = Array.from({ length: 6 }, (_, i) => obs({ outcome: 'independent', supportLevel: 1, at: day(28, 9 + i) }));
    const w = weeklySummary('Alex', [goal()], [...prev, ...cur], NOW, NOW);
    expect(w.changedTrend).toBe('up');
    expect(w.weekSoFar).toBe(true);
    expect(w.narrative.changed).toMatch(/^Week so far: low-support success in communication went from 20% to 100%/);
    expect(w.narrative.changed).not.toMatch(/worth a look/);
  });
});

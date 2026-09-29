/**
 * Summaries, reports and insights for adults (Framework §37, §52).
 * Plain language first, observable wording, evidence-linked, non-diagnostic.
 */
import { recommend } from './decision';
import { DAY_MS, dimensionScores, isSuccess, outcomeScore, summarize } from './evidence';
import { DIMENSIONS, type GrowthGoal, type Observation, type SkillArea } from './types';

export const AREA_LABEL: Record<SkillArea, string> = {
  communication: 'Communication',
  emotions: 'Emotions',
  focus: 'Focus',
  social: 'Social Skills',
  independence: 'Independence',
  routines: 'Daily Routines',
};

export const AREA_SHORT: Record<SkillArea, string> = {
  communication: 'Comm',
  emotions: 'Emotions',
  focus: 'Focus',
  social: 'Social',
  independence: 'Indep',
  routines: 'Routines',
};

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-based week containing `d`. */
export function weekBounds(d: Date): { start: Date; end: Date } {
  const start = startOfDay(d);
  const dow = (start.getDay() + 6) % 7; // Mon = 0
  start.setDate(start.getDate() - dow);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export type RangeKey = '1W' | '1M' | '3M' | '1Y';
export const RANGE_DAYS: Record<RangeKey, number> = { '1W': 7, '1M': 30, '3M': 91, '1Y': 365 };

export function inRange(o: Observation, start: Date, end: Date): boolean {
  const t = new Date(o.at).getTime();
  return t >= start.getTime() && t < end.getTime();
}

const usable = (o: Observation) => o.quality === 'valid' && o.outcome !== 'accessLimited';

export function areaScore(obs: Observation[], area: SkillArea): { score: number; n: number } {
  const xs = obs.filter((o) => o.skillArea === area && usable(o));
  return { score: xs.length ? xs.reduce((s, o) => s + outcomeScore(o), 0) / xs.length : 0, n: xs.length };
}

export function isCelebration(o: Observation): boolean {
  return usable(o) && o.outcome === 'independent' && (o.valence === 'positive' || !!o.realWorld);
}

export function dayCounts(obs: Observation[], weekStart: Date): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const o of obs) {
    const diff = Math.floor((startOfDay(new Date(o.at)).getTime() - weekStart.getTime()) / DAY_MS);
    if (diff >= 0 && diff < 7 && o.quality !== 'invalid') counts[diff] += 1;
  }
  return counts;
}

const SOURCE_LABEL: Record<string, string> = {
  app: 'App',
  home: 'Home',
  school: 'School',
  therapy: 'Therapy',
  community: 'Community',
};

export interface WeeklySummary {
  start: Date;
  end: Date;
  observations: number;
  goals: number;
  celebrations: number;
  focus: { area: SkillArea; score: number; n: number }[];
  narrative: {
    summary: string;
    changed: string;
    sources: string;
    helped: string;
    next: string;
    why: string[];
  };
}

export function weeklySummary(
  name: string,
  goals: GrowthGoal[],
  all: Observation[],
  anchor: Date,
): WeeklySummary {
  const { start, end } = weekBounds(anchor);
  const prevStart = new Date(start.getTime() - 7 * DAY_MS);
  const week = all.filter((o) => inRange(o, start, end) && o.quality !== 'invalid');
  const prev = all.filter((o) => inRange(o, prevStart, start) && o.quality !== 'invalid');
  const active = goals.filter((g) => g.status === 'active');
  const goalsWithEvidence = active.filter((g) => week.some((o) => o.goalId === g.id)).length || active.length;
  const focusAreas: SkillArea[] = ['communication', 'emotions', 'routines', 'independence'];
  const focus = focusAreas.map((area) => ({ area, ...areaScore(week, area) }));

  // Sources
  const srcCounts = new Map<string, number>();
  for (const o of week) srcCounts.set(o.source, (srcCounts.get(o.source) ?? 0) + 1);
  const sources = [...srcCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topSource = sources[0]?.[0];

  // What changed: biggest area change in low-support successes
  let changed = 'Not enough evidence yet to compare with last week.';
  let best = 0;
  for (const area of focusAreas) {
    const now = week.filter((o) => o.skillArea === area && usable(o) && isSuccess(o) && o.supportLevel <= 3).length;
    const before = prev.filter((o) => o.skillArea === area && usable(o) && isSuccess(o) && o.supportLevel <= 3).length;
    if (Math.abs(now - before) > Math.abs(best) && (now >= 2 || before >= 2)) {
      best = now - before;
      changed =
        now >= before
          ? `${AREA_LABEL[area]}: low-support successes went from ${before} to ${now}.`
          : `${AREA_LABEL[area]}: low-support successes went from ${before} to ${now} — worth a look at access and support.`;
    }
  }

  // What helped: most common support level among successes
  const successes = week.filter((o) => usable(o) && isSuccess(o));
  const supportCounts = new Map<number, number>();
  for (const o of successes) supportCounts.set(o.supportLevel, (supportCounts.get(o.supportLevel) ?? 0) + 1);
  const topSupport = [...supportCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const supportText: Record<number, string> = {
    1: 'Many successes were fully independent.',
    2: 'Environmental cues (set-up, visual schedules) were the support used most in successful moments.',
    3: 'Visual cues were the support used most in successful moments.',
    4: 'Gestures and pointing helped most often.',
    5: 'Seeing a model first helped most often.',
    6: 'A brief verbal reminder helped most often.',
    7: 'Doing it together helped most often.',
  };
  const tools = week.flatMap((o) => o.tools);
  const toolLine = tools.length ? ` ${name} used self-advocacy tools ${tools.length} time${tools.length === 1 ? '' : 's'} (for example Help or Break).` : '';

  // Next action from the goal with most evidence
  const ranked = [...active].sort(
    (a, b) => all.filter((o) => o.goalId === b.id).length - all.filter((o) => o.goalId === a.id).length,
  );
  const top = ranked[0];
  const rec = top ? recommend(top, all.filter((o) => o.goalId === top.id), anchor) : null;

  return {
    start,
    end,
    observations: week.length,
    goals: goalsWithEvidence,
    celebrations: week.filter(isCelebration).length,
    focus,
    narrative: {
      summary: week.length
        ? `${name} had ${week.length} learning moment${week.length === 1 ? '' : 's'} this week${topSource ? `, mostly from ${SOURCE_LABEL[topSource].toLowerCase()}` : ''}.`
        : `No observations yet this week.`,
      changed,
      sources: sources.length ? sources.map(([k, v]) => `${SOURCE_LABEL[k]} ${v}`).join(' · ') : 'No sources yet',
      helped: (topSupport ? supportText[topSupport] : 'Not enough successful moments to say what helped.') + toolLine,
      next: rec && top ? `${top.title}: ${rec.title}` : 'Create a Growth Goal to get a suggested next step.',
      why: rec ? rec.reasons.slice(0, 3) : [],
    },
  };
}

export interface KeyInsight {
  id: 'communication' | 'emotions' | 'independence';
  title: string;
  subtitle: string;
  detail: string;
  trend: 'up' | 'steady' | 'down' | 'unknown';
  evidenceIds: string[];
}

export function monthWindow(now: Date, offsetMonths = 0): { start: Date; end: Date } {
  const end = new Date(now.getTime() - offsetMonths * 30 * DAY_MS);
  const start = new Date(end.getTime() - 30 * DAY_MS);
  return { start, end };
}

/** Observational, evidence-linked insights for Coach Insights (Framework §52). */
export function keyInsights(name: string, all: Observation[], now: Date): KeyInsight[] {
  const cur = monthWindow(now);
  const prv = monthWindow(now, 1);
  const inCur = all.filter((o) => inRange(o, cur.start, cur.end));
  const inPrv = all.filter((o) => inRange(o, prv.start, prv.end));

  const commCur = inCur.filter((o) => (o.skillArea === 'communication' || o.skillArea === 'social') && usable(o) && isSuccess(o));
  const commPrv = inPrv.filter((o) => (o.skillArea === 'communication' || o.skillArea === 'social') && usable(o) && isSuccess(o));
  const schoolComm = commCur.filter((o) => o.context.setting === 'school').length;

  const bigCur = inCur.filter((o) => o.skillArea === 'emotions' && o.valence === 'challenging');
  const bigPrv = inPrv.filter((o) => o.skillArea === 'emotions' && o.valence === 'challenging');
  const breathing = inCur.filter((o) => o.tags.includes('deep-breathing') && isSuccess(o)).length;

  const indCur = inCur.filter((o) => (o.skillArea === 'independence' || o.skillArea === 'routines') && o.context.setting === 'home' && usable(o) && isSuccess(o) && o.supportLevel <= 3);
  const indPrv = inPrv.filter((o) => (o.skillArea === 'independence' || o.skillArea === 'routines') && o.context.setting === 'home' && usable(o) && isSuccess(o) && o.supportLevel <= 3);
  const indAll = inCur.filter((o) => (o.skillArea === 'independence' || o.skillArea === 'routines') && o.context.setting === 'home' && usable(o));

  const trend = (a: number, b: number, fewerIsBetter = false): KeyInsight['trend'] => {
    if (a + b < 2) return 'unknown';
    if (a === b) return 'steady';
    const up = a > b;
    return fewerIsBetter ? (up ? 'down' : 'up') : up ? 'up' : 'down';
  };

  return [
    {
      id: 'communication',
      title: commCur.length >= commPrv.length ? 'Stronger communication' : 'Communication',
      subtitle: commCur.length >= commPrv.length ? 'More positive interactions' : 'Fewer logged successes',
      detail: `${commCur.length} successful communication or social moments this month (last month ${commPrv.length}). ${schoolComm < 2 ? 'School evidence is still limited.' : `${schoolComm} came from school.`}`,
      trend: trend(commCur.length, commPrv.length),
      evidenceIds: commCur.map((o) => o.id),
    },
    {
      id: 'emotions',
      title: bigCur.length <= bigPrv.length ? 'Emotional regulation' : 'Big feelings',
      subtitle: bigCur.length <= bigPrv.length ? 'Fewer big moments' : 'More challenging moments logged',
      detail: `Challenging moments logged: ${bigCur.length} (last month ${bigPrv.length}).${breathing ? ` Deep breathing was chosen ${breathing} time${breathing === 1 ? '' : 's'}.` : ''} Fewer logs can also mean fewer observations — check the evidence count.`,
      trend: trend(bigCur.length, bigPrv.length, true),
      evidenceIds: bigCur.map((o) => o.id),
    },
    {
      id: 'independence',
      title: indCur.length >= indPrv.length ? 'Growing independence' : 'Independence',
      subtitle: indCur.length >= indPrv.length ? 'More confidence at home' : 'More support used at home',
      detail: `${indCur.length} of ${indAll.length} home routine or independence moments needed a visual cue or less (last month ${indPrv.length}).`,
      trend: trend(indCur.length, indPrv.length),
      evidenceIds: indCur.map((o) => o.id),
    },
  ];
}

export interface Pattern {
  title: string;
  detail: string;
}

export function patterns(name: string, all: Observation[], now: Date): Pattern[] {
  const cur = monthWindow(now);
  const obs = all.filter((o) => inRange(o, cur.start, cur.end) && usable(o));
  const out: Pattern[] = [];
  const bySetting = new Map<string, Observation[]>();
  for (const o of obs) bySetting.set(o.context.setting, [...(bySetting.get(o.context.setting) ?? []), o]);
  const rated = [...bySetting.entries()]
    .filter(([, v]) => v.length >= 3)
    .map(([k, v]) => ({ k, rate: v.filter(isSuccess).length / v.length, n: v.length }))
    .sort((a, b) => b.rate - a.rate);
  if (rated.length) {
    const hi = rated[0];
    out.push({ title: `Strongest setting: ${cap(hi.k)}`, detail: `${Math.round(hi.rate * 100)}% of ${hi.n} opportunities there were successful.` });
    const lo = rated[rated.length - 1];
    if (rated.length > 1) out.push({ title: `Most support needed: ${cap(lo.k)}`, detail: `${Math.round(lo.rate * 100)}% of ${lo.n} opportunities were successful — a place to add supports, not a judgement.` });
  }
  const morning = obs.filter((o) => new Date(o.at).getHours() < 12);
  const afternoon = obs.filter((o) => new Date(o.at).getHours() >= 12);
  if (morning.length >= 3 && afternoon.length >= 3) {
    const m = morning.filter(isSuccess).length / morning.length;
    const a = afternoon.filter(isSuccess).length / afternoon.length;
    out.push({
      title: m >= a ? 'Mornings tend to go smoothly' : 'Afternoons tend to go smoothly',
      detail: `Morning success ${Math.round(m * 100)}% vs afternoon ${Math.round(a * 100)}%.`,
    });
  }
  const tools = obs.flatMap((o) => o.tools);
  if (tools.length) {
    out.push({ title: 'Self-advocacy in action', detail: `${name} used Help, Break or More Time ${tools.length} time${tools.length === 1 ? '' : 's'} this month. Each use is communication, not avoidance.` });
  }
  if (!out.length) out.push({ title: 'Not enough evidence yet', detail: 'Patterns appear after a few weeks of observations across settings.' });
  return out;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ProgressReport {
  bars: { area: SkillArea; score: number; n: number }[];
  skillsGrowing: number;
  goalsInProgress: number;
  milestones: { goalId: string; label: string; at: string }[];
}

export function progressReport(goals: GrowthGoal[], all: Observation[], range: RangeKey, now: Date): ProgressReport {
  const start = new Date(now.getTime() - RANGE_DAYS[range] * DAY_MS);
  const recent = all.filter((o) => new Date(o.at) >= start);
  const areas: SkillArea[] = ['communication', 'emotions', 'focus', 'social', 'independence'];
  const bars = areas.map((area) => ({ area, ...areaScore(recent, area) }));
  const active = goals.filter((g) => g.status === 'active');
  let skillsGrowing = 0;
  const milestones: ProgressReport['milestones'] = [];
  for (const g of active) {
    const obs = all.filter((o) => o.goalId === g.id);
    const before = dimensionScores(summarize(obs.filter((o) => new Date(o.at) < start)));
    const after = dimensionScores(summarize(obs));
    for (const d of DIMENSIONS) if (after[d] > before[d] + 0.001) skillsGrowing += 1;
    const firsts: [string, (o: Observation) => boolean][] = [
      ['First independent try', (o) => usable(o) && o.outcome === 'independent'],
      ['First real-world use', (o) => usable(o) && !!o.realWorld && isSuccess(o)],
      ['Remembered after a break', (o) => usable(o) && (o.delayDays ?? 0) >= 1 && isSuccess(o)],
    ];
    const sorted = [...obs].sort((a, b) => (a.at < b.at ? -1 : 1));
    for (const [label, test] of firsts) {
      const first = sorted.find(test);
      if (first && new Date(first.at) >= start) milestones.push({ goalId: g.id, label: `${label}: ${g.title}`, at: first.at });
    }
  }
  return { bars, skillsGrowing, goalsInProgress: active.length, milestones };
}

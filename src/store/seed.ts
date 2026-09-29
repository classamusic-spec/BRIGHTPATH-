/**
 * Demo data so every screen has something real to show on first launch.
 * Deterministic (seeded PRNG) and anchored to "now" so charts stay current.
 * Adults can wipe it any time from Data & Privacy.
 */
import { templateById } from '@/content/curriculum';
import {
  VERSIONS,
  type EvidenceSource,
  type GrowthGoal,
  type Learner,
  type Observation,
  type Outcome,
  type Rewards,
  type Setting,
  type SkillArea,
  type SupportLevel,
  type SupportPathPlan,
  type TeamMember,
  type Valence,
} from '@/engine/types';

import { DEFAULT_ACCESS } from './defaults';

export interface SeedData {
  learners: Learner[];
  goals: GrowthGoal[];
  observations: Observation[];
  team: TeamMember[];
  plans: SupportPathPlan[];
  rewards: Record<string, Rewards>;
}

function mulberry32(a: number) {
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 24 * 3600 * 1000;

export const ALEX_ID = 'learner-alex';

const OTHER_LEARNERS: [string, number, string, Learner['buddy']][] = [
  ['Maya', 7, '2nd Grade', 'pip'],
  ['Jonah', 5, 'Kindergarten', 'tilly'],
  ['Priya', 8, '3rd Grade', 'roo'],
  ['Leo', 6, '1st Grade', 'finn'],
  ['Zoe', 7, '2nd Grade', 'pip'],
  ['Sam', 9, '4th Grade', 'roo'],
  ['Ava', 6, '1st Grade', 'tilly'],
  ['Eli', 8, '3rd Grade', 'finn'],
  ['Noah', 5, 'Kindergarten', 'pip'],
  ['Mia', 7, '2nd Grade', 'roo'],
  ['Kai', 6, '1st Grade', 'tilly'],
];

function goalFromTemplate(
  id: string,
  learnerId: string,
  templateId: string,
  now: Date,
  opts: Partial<GrowthGoal> & { createdDaysAgo: number },
): GrowthGoal {
  const t = templateById(templateId)!;
  const { createdDaysAgo, ...rest } = opts;
  return {
    id,
    learnerId,
    title: t.title,
    family: t.family,
    skillArea: t.skillArea,
    templateId,
    observableAction: t.observableAction,
    functionalContext: t.functionalContext,
    acceptedModalities: t.modalities,
    successDefinition: t.successDefinition,
    priorityContexts: t.contexts,
    band: 'B',
    gameEngine: t.engine,
    targetDate: new Date(now.getTime() + 77 * DAY).toISOString(),
    status: 'active',
    notes: '',
    createdAt: new Date(now.getTime() - createdDaysAgo * DAY).toISOString(),
    supportLevel: 3,
    protectedSupports: ['Picture choices', 'Text-to-speech'],
    realWorldRequired: t.realWorld,
    flags: {},
    adaptations: [],
    spaced: { index: 2, nextDue: new Date(now.getTime() + 6 * 3600 * 1000).toISOString() },
    missionIds: t.missionIds,
    ...rest,
  };
}

export function buildSeed(now: Date = new Date()): SeedData {
  const rand = mulberry32(20260929);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  let counter = 0;
  const observations: Observation[] = [];

  const at = (daysAgo: number, hour?: number, minute?: number) => {
    const d = new Date(now.getTime() - daysAgo * DAY);
    d.setHours(hour ?? 8 + Math.floor(rand() * 10), minute ?? Math.floor(rand() * 60), 0, 0);
    // never in the future
    if (d.getTime() > now.getTime()) d.setTime(now.getTime() - (5 + Math.floor(rand() * 90)) * 60 * 1000);
    return d.toISOString();
  };

  const add = (o: Partial<Observation> & { learnerId: string; skillArea: SkillArea; outcome: Outcome; at: string }) => {
    counter += 1;
    const obs: Observation = {
      id: `seed-${counter}`,
      source: 'app',
      context: { setting: 'app' },
      quality: o.outcome === 'accessLimited' ? 'accessLimited' : 'valid',
      supportLevel: 3,
      tools: [],
      tags: [],
      versions: { content: VERSIONS.content, logic: VERSIONS.decisionLogic, evidence: VERSIONS.evidenceSchema },
      ...o,
    };
    observations.push(obs);
    return obs;
  };

  /* ------------------------------------------------------------ Learners */
  const alex: Learner = {
    id: ALEX_ID,
    displayName: 'Alex',
    fullName: 'Alex Rivera',
    age: 6,
    ageBand: '5–7',
    grade: '1st Grade',
    buddy: 'finn',
    interests: ['animals', 'art', 'nature'],
    strengths: ['Kind', 'creative', 'resilient'],
    band: 'B',
    access: DEFAULT_ACCESS,
    createdAt: new Date(now.getTime() - 80 * DAY).toISOString(),
    summaryLine: 'A kind, curious learner who’s making great progress!',
  };
  const others: Learner[] = OTHER_LEARNERS.map(([name, age, grade, buddy], i) => ({
    id: `learner-${name.toLowerCase()}`,
    displayName: name,
    fullName: name,
    age,
    grade,
    buddy,
    interests: [pick(['animals', 'music', 'sports', 'building', 'books'] as const)],
    strengths: [pick(['Curious', 'Funny', 'Patient', 'Creative', 'Helpful'])],
    band: age <= 5 ? 'A' : age >= 8 ? 'C' : 'B',
    access: DEFAULT_ACCESS,
    createdAt: new Date(now.getTime() - (40 + i * 3) * DAY).toISOString(),
  }));

  /* --------------------------------------------------------------- Goals */
  const gKind = goalFromTemplate('goal-kind-words', ALEX_ID, 'express-kindness', now, {
    createdDaysAgo: 62,
    title: 'Use kind words when feeling upset',
    notes: 'Alex is learning to pause and use kind words during challenging moments.',
    supportLevel: 3,
    // Due now, so it is Today's Mission.
    spaced: { index: 2, nextDue: new Date(now.getTime() - 2 * 3600 * 1000).toISOString() },
  });
  const gHelp = goalFromTemplate('goal-ask-help', ALEX_ID, 'request-help', now, { createdDaysAgo: 70, supportLevel: 2 });
  const gCalm = goalFromTemplate('goal-calm-tool', ALEX_ID, 'choose-support-tool', now, {
    createdDaysAgo: 48,
    supportLevel: 3,
    currentPattern: 'Sometimes yells or pushes items away when a plan changes quickly.',
  });
  const gRoutine = goalFromTemplate('goal-morning', ALEX_ID, 'short-routine', now, { createdDaysAgo: 40, supportLevel: 3 });
  const gFlex = goalFromTemplate('goal-flex', ALEX_ID, 'try-another-option', now, { createdDaysAgo: 18, supportLevel: 5 });
  const goals: GrowthGoal[] = [gKind, gHelp, gCalm, gRoutine, gFlex];
  goals.push(
    goalFromTemplate('goal-maya-break', 'learner-maya', 'request-break', now, { createdDaysAgo: 30 }),
    goalFromTemplate('goal-jonah-transition', 'learner-jonah', 'transition', now, { createdDaysAgo: 25, supportLevel: 5 }),
    goalFromTemplate('goal-priya-friend', 'learner-priya', 'respond-to-friend', now, { createdDaysAgo: 21 }),
  );

  /* ------------------------------------------------ Alex: app practice */
  // Growth over ~9 weeks: support fades and success rises. Weekly cadence.
  const appPlan: { goal: GrowthGoal; mission: string; weeks: number; start: number; end: number; startSupport: number; endSupport: number }[] = [
    { goal: gKind, mission: 'be-kind-home', weeks: 8, start: 0.35, end: 0.72, startSupport: 5, endSupport: 3 },
    { goal: gHelp, mission: 'help-hero', weeks: 9, start: 0.45, end: 0.92, startSupport: 5, endSupport: 1 },
    { goal: gCalm, mission: 'be-kind-home', weeks: 6, start: 0.3, end: 0.7, startSupport: 5, endSupport: 3 },
    { goal: gRoutine, mission: 'morning-road', weeks: 5, start: 0.4, end: 0.78, startSupport: 4, endSupport: 2 },
    { goal: gFlex, mission: 'flexi-fix', weeks: 2, start: 0.3, end: 0.5, startSupport: 5, endSupport: 5 },
  ];
  for (const p of appPlan) {
    for (let w = p.weeks - 1; w >= 0; w--) {
      const progress = 1 - w / Math.max(1, p.weeks - 1);
      const rate = p.start + (p.end - p.start) * progress;
      const support = Math.round(p.startSupport + (p.endSupport - p.startSupport) * progress) as SupportLevel;
      const sessions = 2;
      for (let s = 0; s < sessions; s++) {
        const daysAgo = w * 7 + 2 + s * 3 + Math.floor(rand() * 2);
        const r = rand();
        const outcome: Outcome = r < rate * 0.75 ? 'independent' : r < rate ? 'supported' : r < rate + 0.15 ? 'partial' : 'notDemonstrated';
        add({
          learnerId: ALEX_ID,
          goalId: p.goal.id,
          skillArea: p.goal.skillArea,
          missionId: p.mission,
          outcome,
          supportLevel: outcome === 'independent' ? (Math.max(1, support - 1) as SupportLevel) : support,
          at: at(daysAgo),
          modality: 'tap',
          responseMs: 2000 + Math.floor(rand() * 6000),
          tags: p.goal.id === gCalm.id ? ['deep-breathing'] : [],
        });
      }
    }
  }
  // A tired check-in stays access-limited — never counted as failure.
  add({ learnerId: ALEX_ID, goalId: gKind.id, skillArea: 'emotions', outcome: 'accessLimited', quality: 'accessLimited', missionId: 'be-kind-home', at: at(16, 17) });
  // Self-advocacy tools used during missions.
  add({ learnerId: ALEX_ID, goalId: gHelp.id, skillArea: 'communication', outcome: 'supported', supportLevel: 3, tools: ['help'], missionId: 'help-hero', at: at(11, 16) });
  add({ learnerId: ALEX_ID, goalId: gCalm.id, skillArea: 'emotions', outcome: 'independent', supportLevel: 2, tools: ['break'], missionId: 'be-kind-home', tags: ['deep-breathing'], at: at(4, 15) });

  /* -------------------------------- Alex: real-world context evidence */
  type Target = 'strong' | 'growing' | 'some' | 'needs' | 'none';
  const matrix: Record<SkillArea, Record<Setting, Target>> = {
    communication: { home: 'growing', school: 'strong', social: 'some', outdoors: 'strong' },
    emotions: { home: 'growing', school: 'some', social: 'needs', outdoors: 'growing' },
    focus: { home: 'some', school: 'needs', social: 'strong', outdoors: 'some' },
    social: { home: 'strong', school: 'some', social: 'growing', outdoors: 'none' },
    independence: { home: 'some', school: 'growing', social: 'some', outdoors: 'needs' },
    routines: { home: 'growing', school: 'some', social: 'some', outdoors: 'growing' },
  };
  // Each recipe lands in its target band (see cellStatus): strong ≈ 0.95 over
  // 4 observations, growing ≈ 0.85 over 3, some ≈ 0.55, needs ≈ 0.25.
  const recipe: Record<Exclude<Target, 'none'>, [Outcome, SupportLevel][]> = {
    strong: [['independent', 1], ['independent', 1], ['independent', 2], ['supported', 2]],
    growing: [['independent', 2], ['supported', 3], ['supported', 3]],
    some: [['supported', 4], ['partial', 5], ['supported', 3]],
    needs: [['partial', 5], ['notDemonstrated', 6], ['supported', 6]],
  };
  const areaGoal: Partial<Record<SkillArea, GrowthGoal>> = {
    communication: gKind,
    emotions: gCalm,
    routines: gRoutine,
    focus: gFlex,
  };
  const sourceFor: Record<Setting, EvidenceSource> = { home: 'home', school: 'school', social: 'community', outdoors: 'home' };
  const titles: Record<Setting, string[]> = {
    home: ['At Home', 'Getting Ready', 'Family Dinner', 'Bedtime'],
    school: ['At School', 'Classroom', 'Recess', 'Library Time'],
    social: ['Birthday Party', 'Play Date', 'At the Store'],
    outdoors: ['At the Park', 'Nature Walk', 'Playground'],
  };
  const notes: Record<SkillArea, string[]> = {
    communication: ['Asked for help with a zipper using words.', 'Tapped the Help card during math.', 'Used kind words with a sibling after a disagreement.'],
    emotions: ['Chose deep breathing after the tower fell.', 'Asked for a break when the room got loud.', 'Big feelings when the game ended early; used the break card after a model.'],
    focus: ['Picked another game when the first one was busy.', 'Switched to the swings when the slide was closed.', 'Needed a model to try another option.'],
    social: ['Shared blocks and waited for a turn.', 'Invited a friend to build.', 'Said “you can have it next.”'],
    independence: ['Packed the backpack with the picture list.', 'Put shoes on with one reminder.', 'Found the lunchbox on their own.'],
    routines: ['Followed the morning steps with the picture schedule.', 'Brushed teeth, then chose a story.', 'Moved from play to dinner with First-Then.'],
  };
  // Spread over ~7 weeks; tricky moments skew older, so recent weeks read as growth.
  const dayFor = (outcome: Outcome) => (outcome === 'partial' || outcome === 'notDemonstrated' ? 22 + Math.floor(rand() * 26) : 1 + Math.floor(rand() * 47));
  for (const area of Object.keys(matrix) as SkillArea[]) {
    for (const setting of Object.keys(matrix[area]) as Setting[]) {
      const target = matrix[area][setting];
      if (target === 'none') {
        add({ learnerId: ALEX_ID, skillArea: area, outcome: 'independent', supportLevel: 2, source: sourceFor[setting], context: { setting }, realWorld: true, at: at(26), title: pick(titles[setting]), note: 'Only one observation so far.', valence: 'positive' });
        continue;
      }
      for (const [outcome, support] of recipe[target]) {
        const valence: Valence = outcome === 'independent' ? 'positive' : outcome === 'supported' ? pick(['positive', 'neutral'] as Valence[]) : 'challenging';
        add({
          learnerId: ALEX_ID,
          goalId: areaGoal[area]?.id,
          skillArea: area,
          outcome,
          supportLevel: support,
          source: sourceFor[setting],
          context: { setting, person: setting === 'school' ? 'teacher' : setting === 'home' ? 'parent' : 'peer' },
          realWorld: true,
          valence,
          title: pick(titles[setting]),
          note: pick(notes[area]),
          tags: area === 'emotions' && outcome !== 'notDemonstrated' ? ['deep-breathing'] : [],
          at: at(dayFor(outcome)),
        });
      }
    }
  }
  // Retention probe for Ask for help (remembered after a week).
  add({ learnerId: ALEX_ID, goalId: gHelp.id, skillArea: 'communication', outcome: 'independent', supportLevel: 1, source: 'school', context: { setting: 'school', person: 'teacher' }, realWorld: true, delayDays: 7, valence: 'positive', title: 'Classroom', note: 'Raised the Help card without a reminder after a week off.', at: at(9, 10) });
  add({ learnerId: ALEX_ID, goalId: gHelp.id, skillArea: 'communication', outcome: 'independent', supportLevel: 1, source: 'school', context: { setting: 'school', person: 'teacher' }, realWorld: true, valence: 'positive', title: 'Classroom', note: 'Asked “Can you help me, please?” with a stuck zipper.', at: at(2, 8) });
  // Last complete week always has independence and routine moments (7 days ago is always in it).
  add({ learnerId: ALEX_ID, skillArea: 'independence', outcome: 'supported', supportLevel: 4, source: 'home', context: { setting: 'home', person: 'parent' }, realWorld: true, valence: 'positive', title: 'Getting Ready', note: 'Packed the backpack with the picture list.', at: at(7, 8, 5) });
  add({ learnerId: ALEX_ID, goalId: gRoutine.id, skillArea: 'routines', outcome: 'independent', supportLevel: 2, missionId: 'morning-road', modality: 'tap', at: at(7, 17, 30) });
  // The reference moment on Real-World Observation.
  add({
    learnerId: ALEX_ID,
    goalId: gKind.id,
    skillArea: 'communication',
    outcome: 'independent',
    supportLevel: 1,
    source: 'home',
    context: { setting: 'outdoors', person: 'peer', activity: 'Playground' },
    realWorld: true,
    valence: 'positive',
    title: 'At the Park',
    note: 'Alex shared a toy with a friend and used kind words!',
    tags: ['Social Skills', 'Kindness', 'Independence'],
    at: at(0, 10, 24),
  });

  /* ------------------------------------------- Other learners (lighter) */
  for (const l of others) {
    const n = 3 + Math.floor(rand() * 5);
    for (let i = 0; i < n; i++) {
      const r = rand();
      add({
        learnerId: l.id,
        goalId: goals.find((g) => g.learnerId === l.id)?.id,
        skillArea: pick(['communication', 'emotions', 'routines', 'social'] as SkillArea[]),
        outcome: r < 0.45 ? 'independent' : r < 0.75 ? 'supported' : 'partial',
        supportLevel: pick([1, 2, 3, 3, 5] as SupportLevel[]),
        source: pick(['app', 'home', 'school'] as EvidenceSource[]),
        context: { setting: pick(['home', 'school', 'social'] as Setting[]) },
        valence: r < 0.45 ? 'positive' : 'neutral',
        at: at(Math.floor(rand() * 7)),
      });
    }
  }
  // Two learners have recent evidence that needs a closer look.
  for (const id of ['learner-jonah', 'learner-priya']) {
    for (let i = 0; i < 3; i++) {
      add({
        learnerId: id,
        goalId: goals.find((g) => g.learnerId === id)?.id,
        skillArea: 'emotions',
        outcome: 'partial',
        supportLevel: 6,
        source: 'school',
        context: { setting: 'school' },
        valence: 'challenging',
        at: at(1 + i),
      });
    }
  }

  /* ---------------------------------------------------------------- Team */
  const team: TeamMember[] = [
    { id: 'tm-you', name: 'Taylor', role: 'parent', title: 'Parent / Caregiver', permission: 'owner', avatar: 'you', learnerIds: [ALEX_ID, ...others.map((o) => o.id)], isSelf: true },
    { id: 'tm-mrs-taylor', name: 'Mrs. Taylor', role: 'teacher', title: 'Teacher', permission: 'edit', avatar: 'mrsTaylor', learnerIds: [ALEX_ID] },
    { id: 'tm-dr-kim', name: 'Dr. Kim', role: 'therapist', title: 'Therapist', permission: 'edit', avatar: 'drKim', learnerIds: [ALEX_ID] },
    { id: 'tm-jordan', name: 'Coach Jordan', role: 'coach', title: 'Coach', permission: 'view', avatar: 'jordan', learnerIds: [ALEX_ID] },
  ];

  const plans: SupportPathPlan[] = [
    {
      id: 'plan-alex-1',
      learnerId: ALEX_ID,
      goalId: gCalm.id,
      pattern: {
        description: 'Yells or pushes items away when a plan changes quickly.',
        when: 'Late afternoon at home, when screen time ends.',
        before: 'A sudden “time’s up” without a warning.',
        after: 'An adult removes the task; things calm down.',
      },
      possibleNeed: 'predictability',
      preferredPath: 'Use the break card or ask for “one more minute”.',
      meetsSameNeed: true,
      supports: ['First-Then card', 'Visual timer (optional)', 'Break card within reach'],
      reviewNotes: '',
      completedSteps: [1, 2],
      currentStep: 3,
      highRisk: false,
      createdAt: new Date(now.getTime() - 12 * DAY).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * DAY).toISOString(),
    },
  ];

  const rewards: Record<string, Rewards> = {
    [ALEX_ID]: {
      stars: 12,
      badges: [
        { id: 'brave', earnedAt: new Date(now.getTime() - 9 * DAY).toISOString() },
        { id: 'kind', earnedAt: new Date(now.getTime() - 5 * DAY).toISOString() },
        { id: 'explorer', earnedAt: new Date(now.getTime() - 2 * DAY).toISOString() },
      ],
      placed: ['plant', 'chair', 'poster', 'rug'],
      history: [{ at: new Date(now.getTime() - 2 * DAY).toISOString(), stars: 3, reason: 'Finished a mission' }],
    },
  };

  return { learners: [alex, ...others], goals, observations, team, plans, rewards };
}

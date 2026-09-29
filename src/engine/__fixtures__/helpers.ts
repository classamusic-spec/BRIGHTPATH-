import type { GrowthGoal, Observation, Outcome, SupportLevel } from '../types';

let n = 0;
export function obs(partial: Partial<Observation> & { outcome: Outcome; at: string }): Observation {
  n += 1;
  return {
    id: `o${n}`,
    learnerId: 'l1',
    goalId: 'g1',
    skillArea: 'communication',
    source: 'app',
    context: { setting: 'app' },
    quality: 'valid',
    supportLevel: 3 as SupportLevel,
    tools: [],
    tags: [],
    versions: { content: '2', logic: '2', evidence: '2' },
    ...partial,
  };
}

export function goal(partial: Partial<GrowthGoal> = {}): GrowthGoal {
  return {
    id: 'g1',
    learnerId: 'l1',
    title: 'Ask for help',
    family: 'communication',
    skillArea: 'communication',
    observableAction: 'Requests help using any accepted method.',
    functionalContext: 'Homework',
    acceptedModalities: ['speech', 'aac', 'tap'],
    successDefinition: 'Help is requested in the learner’s own way.',
    priorityContexts: ['home', 'school'],
    band: 'B',
    gameEngine: 'helpHero',
    status: 'active',
    notes: '',
    createdAt: '2026-08-01T09:00:00.000Z',
    supportLevel: 3,
    protectedSupports: ['AAC'],
    realWorldRequired: true,
    flags: {},
    adaptations: [],
    spaced: { index: 0 },
    missionIds: ['help-hero'],
    ...partial,
  };
}

/** ISO date `d` days after 2026-09-01 at hour h. */
export function day(d: number, h = 10): string {
  return new Date(Date.UTC(2026, 8, 1 + d, h, 0, 0)).toISOString();
}

/**
 * Starter curriculum (Framework Part XX). Goal templates give adults an
 * observable starting point they can edit before a goal becomes Active.
 */
import type { GameEngine, GoalFamily, Modality, Setting, SkillArea } from '@/engine/types';

import type { IconId, Tone } from './types';

export interface FocusOption {
  id: 'communication' | 'feelings' | 'routines' | 'independence' | 'new';
  label: string;
  icon: IconId | 'calendar' | 'person';
  tone: Tone;
  family: GoalFamily;
}

/** "What would you like to focus on?" (Create a Growth Goal). */
export const FOCUS_OPTIONS: FocusOption[] = [
  { id: 'communication', label: 'Build communication', icon: 'chatOrange', tone: 'orange', family: 'communication' },
  { id: 'feelings', label: 'Manage big feelings', icon: 'heart', tone: 'blush', family: 'selfAwareness' },
  { id: 'routines', label: 'Follow routines', icon: 'calendar', tone: 'lavender', family: 'routines' },
  { id: 'independence', label: 'Be more independent', icon: 'person', tone: 'blue', family: 'routines' },
  { id: 'new', label: 'Try something new', icon: 'star', tone: 'butter', family: 'flexibility' },
];

export interface GoalTemplate {
  id: string;
  family: GoalFamily;
  focus: FocusOption['id'][];
  title: string;
  skillArea: SkillArea;
  observableAction: string;
  functionalContext: string;
  successDefinition: string;
  modalities: Modality[];
  contexts: Setting[];
  engine: GameEngine;
  missionIds: string[];
  realWorld: boolean;
}

const MULTI: Modality[] = ['speech', 'aac', 'picture', 'gesture', 'tap'];

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // Communication & Self-Advocacy
  { id: 'request-help', family: 'communication', focus: ['communication', 'independence'], title: 'Ask for help', skillArea: 'communication', observableAction: 'Requests help using any accepted method when a task is hard.', functionalContext: 'Homework, dressing, reaching items, play', successDefinition: 'Help is requested before frustration builds, in the learner’s own way.', modalities: MULTI, contexts: ['home', 'school'], engine: 'helpHero', missionIds: ['help-hero'], realWorld: true },
  { id: 'request-break', family: 'communication', focus: ['communication', 'feelings'], title: 'Ask for a break', skillArea: 'communication', observableAction: 'Requests a break using words, a card or a sign.', functionalContext: 'Busy or loud moments, long tasks', successDefinition: 'A break is requested and taken; returning is optional.', modalities: MULTI, contexts: ['home', 'school'], engine: 'helpHero', missionIds: ['help-hero'], realWorld: true },
  { id: 'more-time', family: 'communication', focus: ['communication'], title: 'Ask for more time', skillArea: 'communication', observableAction: 'Signals “more time” instead of rushing or leaving.', functionalContext: 'Transitions, tasks with time pressure', successDefinition: 'More time is requested in any accepted way.', modalities: MULTI, contexts: ['home', 'school'], engine: 'transitionTrain', missionIds: [], realWorld: true },
  { id: 'say-stop', family: 'communication', focus: ['communication'], title: 'Say Stop / Not Yet', skillArea: 'communication', observableAction: 'Communicates Stop or Not Yet clearly.', functionalContext: 'Play, touch, changes to plans', successDefinition: 'The message is communicated and respected.', modalities: MULTI, contexts: ['home', 'school', 'social'], engine: 'helpHero', missionIds: [], realWorld: true },
  { id: 'express-choice', family: 'communication', focus: ['communication'], title: 'Express a choice', skillArea: 'communication', observableAction: 'Chooses between options using any method.', functionalContext: 'Snacks, games, activities', successDefinition: 'A preference is communicated when offered a choice.', modalities: MULTI, contexts: ['home', 'school'], engine: 'buildTogether', missionIds: [], realWorld: true },
  { id: 'express-kindness', family: 'social', focus: ['communication'], title: 'Use kind words when feeling upset', skillArea: 'communication', observableAction: 'Uses a kind word, sign or card during a frustrating moment.', functionalContext: 'Family time, play with siblings', successDefinition: 'A kind message is shared at least once in a hard moment.', modalities: MULTI, contexts: ['home', 'social'], engine: 'kindChoiceStories', missionIds: ['be-kind-home', 'pip-tower'], realWorld: true },
  // Routines & Independence
  { id: 'short-routine', family: 'routines', focus: ['routines', 'independence'], title: 'Follow a short routine', skillArea: 'routines', observableAction: 'Completes a 3–4 step routine with picture steps.', functionalContext: 'Morning, bedtime, leaving the house', successDefinition: 'Steps are completed with a visual cue or less.', modalities: ['tap', 'picture', 'observed'], contexts: ['home'], engine: 'routineRoad', missionIds: ['morning-road'], realWorld: true },
  { id: 'transition', family: 'routines', focus: ['routines'], title: 'Move to the next activity', skillArea: 'routines', observableAction: 'Transitions with First-Then and optional more time.', functionalContext: 'Screen time ending, leaving the park', successDefinition: 'Transition happens with support; More Time is allowed.', modalities: MULTI, contexts: ['home', 'school', 'outdoors'], engine: 'transitionTrain', missionIds: [], realWorld: true },
  { id: 'gather-items', family: 'routines', focus: ['independence'], title: 'Gather needed items', skillArea: 'independence', observableAction: 'Collects the items needed for an activity.', functionalContext: 'Packing a backpack, getting ready to paint', successDefinition: 'Items are gathered using a checklist or less.', modalities: ['tap', 'picture', 'observed'], contexts: ['home', 'school'], engine: 'routineRoad', missionIds: ['morning-road'], realWorld: true },
  { id: 'visual-schedule', family: 'routines', focus: ['routines'], title: 'Use a visual schedule', skillArea: 'routines', observableAction: 'Checks the schedule to see what comes next.', functionalContext: 'School day, weekends', successDefinition: 'The schedule is checked when unsure.', modalities: ['tap', 'picture', 'observed'], contexts: ['home', 'school'], engine: 'routineRoad', missionIds: ['morning-road'], realWorld: true },
  // Flexibility & Problem Solving
  { id: 'try-another-option', family: 'flexibility', focus: ['new'], title: 'Try another option', skillArea: 'focus', observableAction: 'Chooses a different option when the first one is unavailable.', functionalContext: 'Games, playground, food', successDefinition: 'Another option is tried while the original need is respected.', modalities: MULTI, contexts: ['home', 'outdoors'], engine: 'flexiFix', missionIds: ['flexi-fix'], realWorld: true },
  { id: 'handle-small-change', family: 'flexibility', focus: ['new', 'feelings'], title: 'Handle a small change', skillArea: 'focus', observableAction: 'Uses a tool (break, breath, ask) when plans change.', functionalContext: 'Schedule changes, cancelled plans', successDefinition: 'A support tool is used and the day continues.', modalities: MULTI, contexts: ['home', 'school'], engine: 'flexiFix', missionIds: ['flexi-fix'], realWorld: true },
  // Self-Awareness & Support
  { id: 'choose-support-tool', family: 'selfAwareness', focus: ['feelings'], title: 'Choose a calming tool', skillArea: 'emotions', observableAction: 'Chooses a tool such as deep breathing or a break when upset.', functionalContext: 'Frustrating moments at home or school', successDefinition: 'A tool is chosen (any modality); feelings are never required to be labelled.', modalities: MULTI, contexts: ['home', 'school'], engine: 'feelingsTools', missionIds: ['be-kind-home'], realWorld: true },
  { id: 'too-much', family: 'selfAwareness', focus: ['feelings'], title: 'Communicate “Too much”', skillArea: 'emotions', observableAction: 'Signals “too much” when sensory load is high.', functionalContext: 'Loud places, crowded rooms', successDefinition: 'The message is sent and the environment is adjusted.', modalities: MULTI, contexts: ['home', 'school', 'social'], engine: 'feelingsTools', missionIds: [], realWorld: true },
  // Social Connection
  { id: 'respond-to-friend', family: 'social', focus: ['communication'], title: 'Respond to a friend', skillArea: 'social', observableAction: 'Responds to a peer’s request or feeling in any way.', functionalContext: 'Play dates, recess', successDefinition: 'A response is given; joining in stays optional.', modalities: MULTI, contexts: ['school', 'social'], engine: 'kindChoiceStories', missionIds: ['pip-tower'], realWorld: true },
  { id: 'collaborative-turn', family: 'social', focus: ['new'], title: 'Take a collaborative turn (when wanted)', skillArea: 'social', observableAction: 'Takes a turn in a shared activity when they choose to.', functionalContext: 'Board games, building', successDefinition: 'A turn is taken; stopping is always allowed.', modalities: MULTI, contexts: ['home', 'school', 'social'], engine: 'buildTogether', missionIds: ['pip-tower'], realWorld: false },
];

export function templatesForFocus(focus: FocusOption['id']): GoalTemplate[] {
  return GOAL_TEMPLATES.filter((t) => t.focus.includes(focus));
}

export function templateById(id: string): GoalTemplate | undefined {
  return GOAL_TEMPLATES.find((t) => t.id === id);
}

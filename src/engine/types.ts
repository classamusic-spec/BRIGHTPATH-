/**
 * BrightPath v2 domain model.
 *
 * Mirrors the Framework: Growth Goals with six independent dimensions,
 * opportunity events that separate access from performance, explainable
 * recommendations and versioned evidence (Parts II, III, X, XII).
 */

export const VERSIONS = {
  content: '2.0.0',
  decisionLogic: '2.0.0',
  growthLogic: '2.0.0',
  evidenceSchema: '2.0.0',
  gameEngine: '2.0.0',
  designSystem: '2.0.0',
} as const;

export type GrowthDimension =
  | 'emergence'
  | 'reliability'
  | 'independence'
  | 'flexibility'
  | 'retention'
  | 'functionalUse';

export const DIMENSIONS: GrowthDimension[] = [
  'emergence',
  'reliability',
  'independence',
  'flexibility',
  'retention',
  'functionalUse',
];

export type JourneyMode = 'discover' | 'practice' | 'explore' | 'remember';

export type RecommendationKind =
  | 'discover'
  | 'practice'
  | 'explore'
  | 'remember'
  | 'maintain'
  | 'increaseSupport'
  | 'reduceSupport'
  | 'gatherEvidence'
  | 'reassessAccess'
  | 'reviewGoal'
  | 'supportPath'
  | 'humanReview';

/** BrightPath Support Ladder: 1 = Independent … 7 = Adult-supported. */
export type SupportLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Outcome = 'independent' | 'supported' | 'partial' | 'notDemonstrated' | 'accessLimited';

export type OpportunityQuality = 'valid' | 'accessLimited' | 'invalid';

export type EvidenceSource = 'app' | 'home' | 'school' | 'therapy' | 'community';

/** Context Matrix columns (real-world settings). */
export type Setting = 'home' | 'school' | 'social' | 'outdoors';
export const SETTINGS: Setting[] = ['home', 'school', 'social', 'outdoors'];

export type Modality = 'speech' | 'aac' | 'picture' | 'gesture' | 'tap' | 'typed' | 'observed';

export type SkillArea = 'communication' | 'emotions' | 'focus' | 'social' | 'independence' | 'routines';
export const SKILL_AREAS: SkillArea[] = ['communication', 'emotions', 'focus', 'social', 'independence', 'routines'];

export type GoalFamily = 'communication' | 'routines' | 'flexibility' | 'selfAwareness' | 'social';

/** Agency tools — always available, never rewards (Framework §2.2). */
export type AgencyTool = 'break' | 'help' | 'moreTime' | 'stop' | 'notYet' | 'quiet' | 'myChoice';

export type Valence = 'positive' | 'neutral' | 'challenging';

export type PresentationBand = 'A' | 'B' | 'C';

export type GameEngine =
  | 'kindChoiceStories'
  | 'routineRoad'
  | 'helpHero'
  | 'flexiFix'
  | 'feelingsTools'
  | 'buildTogether'
  | 'memoryGarden'
  | 'transitionTrain';

export type LearningTool =
  | 'showExplore'
  | 'connectIt'
  | 'tryTogether'
  | 'tinySteps'
  | 'repeatVariety'
  | 'fadeHint'
  | 'helpfulFeedback'
  | 'mixSenses'
  | 'findItAgain'
  | 'changePlace'
  | 'changePerson'
  | 'changeMaterials'
  | 'storySwitch'
  | 'surpriseVariation'
  | 'realWorldMission'
  | 'comeBackLater'
  | 'spacePractice'
  | 'quickRetrieval'
  | 'naturalUse'
  | 'refreshWhenNeeded';

export type Readiness = 'ready' | 'quiet' | 'moveFirst' | 'littleOff' | 'needBreak';
export type Feeling = 'happy' | 'calm' | 'okay' | 'sad' | 'worried' | 'tired';

export type GoalStatus = 'draft' | 'active' | 'paused' | 'complete' | 'retired';

export type Confidence = 'early' | 'developing' | 'established';

export interface OpportunityContext {
  /** Where it happened. `app` = structured in-app practice. */
  setting: Setting | 'app';
  person?: string;
  activity?: string;
  materials?: string;
  routine?: string;
  novelty?: 'familiar' | 'new';
}

export interface Observation {
  id: string;
  learnerId: string;
  goalId?: string;
  skillArea: SkillArea;
  missionId?: string;
  source: EvidenceSource;
  observerId?: string;
  /** ISO timestamp. */
  at: string;
  context: OpportunityContext;
  quality: OpportunityQuality;
  outcome: Outcome;
  supportLevel: SupportLevel;
  modality?: Modality;
  responseMs?: number;
  tools: AgencyTool[];
  valence?: Valence;
  title?: string;
  note?: string;
  tags: string[];
  photos?: string[];
  realWorld?: boolean;
  /** Days since the skill was last practised (retention probe). */
  delayDays?: number;
  flags?: { safety?: boolean; distress?: boolean };
  versions: { content: string; logic: string; evidence: string };
}

export interface AdaptationRecord {
  at: string;
  kind: 'fade' | 'restore' | 'increase' | 'context' | 'mode';
  from?: number | string;
  to?: number | string;
  reason: string;
  /** Valid-opportunity count when the change was made (rate limiting). */
  atValidCount: number;
  /**
   * A short help-driven bump (raised after a help or more-time request, or the
   * return to the earlier level). Not counted as an adaptive change.
   */
  temporary?: boolean;
}

export interface SpacedState {
  index: number;
  nextDue?: string;
  lastAt?: string;
}

export interface GrowthGoal {
  id: string;
  learnerId: string;
  title: string;
  family: GoalFamily;
  skillArea: SkillArea;
  templateId?: string;
  observableAction: string;
  functionalContext: string;
  acceptedModalities: Modality[];
  successDefinition: string;
  priorityContexts: Setting[];
  band: PresentationBand;
  gameEngine: GameEngine;
  targetDate?: string;
  status: GoalStatus;
  notes: string;
  createdAt: string;
  supportLevel: SupportLevel;
  /** Adults fixed the support level; automatic changes are not suggested. */
  supportLocked?: boolean;
  protectedSupports: string[];
  realWorldRequired: boolean;
  inappropriateIf?: string;
  flags: {
    noLongerUseful?: boolean;
    conflictsWithAccess?: boolean;
    adultsDisagree?: boolean;
    highRisk?: boolean;
  };
  currentPattern?: string;
  adaptations: AdaptationRecord[];
  spaced: SpacedState;
  missionIds: string[];
}

export interface SensoryProfile {
  music: boolean;
  soundEffects: boolean;
  haptics: boolean;
  animation: 'full' | 'gentle' | 'off';
  backgroundMotion: boolean;
  visualDensity: 'standard' | 'reduced';
  celebration: 'full' | 'gentle' | 'minimal';
}

export interface AccessProfile {
  communication: Modality[];
  presentation: 'audioVisual' | 'visualFirst' | 'iconFirst' | 'modelFirst' | 'minimalText' | 'textAudio';
  processing: 'standard' | 'extended' | 'noTimer';
  sensory: SensoryProfile;
  motor: { largeTargets: boolean; noDrag: boolean; simplifiedGestures: boolean };
  transitions: {
    visualSchedule: boolean;
    firstThen: boolean;
    oneMoreTurn: boolean;
    countdown: boolean;
    explicitAllDone: boolean;
  };
  readAloud: boolean;
}

export type BuddyId = 'maple' | 'pip' | 'tilly' | 'roo';

export type InterestId =
  | 'animals'
  | 'art'
  | 'sports'
  | 'music'
  | 'nature'
  | 'books'
  | 'building'
  | 'helping'
  | 'trains'
  | 'water'
  | 'movement';

export interface Learner {
  id: string;
  displayName: string;
  fullName?: string;
  age?: number;
  ageBand?: string;
  grade?: string;
  buddy: BuddyId;
  interests: InterestId[];
  strengths: string[];
  band: PresentationBand;
  access: AccessProfile;
  createdAt: string;
  avatarTone?: string;
  summaryLine?: string;
}

export type Permission = 'owner' | 'edit' | 'view';
export type TeamRole = 'parent' | 'caregiver' | 'teacher' | 'therapist' | 'coach';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  title: string;
  permission: Permission;
  avatar: 'you' | 'taylor' | 'mrsTaylor' | 'drKim' | 'jordan';
  learnerIds: string[];
  isSelf?: boolean;
  pending?: boolean;
  invitedAt?: string;
}

export type NeedCategory =
  | 'communication'
  | 'movement'
  | 'sensory'
  | 'predictability'
  | 'break'
  | 'connection'
  | 'autonomy'
  | 'uncertain';

export interface SupportPathPlan {
  id: string;
  learnerId: string;
  goalId?: string;
  pattern: { description: string; when: string; before: string; after: string };
  possibleNeed: NeedCategory;
  preferredPath: string;
  meetsSameNeed: boolean;
  supports: string[];
  reviewNotes: string;
  completedSteps: number[];
  currentStep: 1 | 2 | 3 | 4 | 5;
  highRisk: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: 'brave' | 'kind' | 'explorer' | 'calm' | 'helper' | 'routine';
  earnedAt: string;
}

export interface Rewards {
  stars: number;
  badges: Badge[];
  placed: string[];
  history: { at: string; stars: number; reason: string }[];
}

export interface NotificationPrefs {
  goalReminders: boolean;
  dailyCheckIn: boolean;
  progressUpdates: boolean;
  coachMessages: boolean;
  quietHours: { start: string; end: string };
  reminderTimes: string[];
}

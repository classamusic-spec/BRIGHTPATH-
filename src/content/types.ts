import type { IconName } from '@/components/icons/Icon';
import type {
  GameEngine,
  GoalFamily,
  GrowthDimension,
  JourneyMode,
  Modality,
  PresentationBand,
  Setting,
  SkillArea,
  SupportLevel,
} from '@/engine/types';

/** Icons available to content authors (rendered by components/icons). */
export type IconId = IconName;

export type Tone = 'mint' | 'sky' | 'butter' | 'lavender' | 'blush' | 'blue' | 'orange' | 'white';

export type SceneId = 'playroom' | 'bedroom' | 'shelf' | 'puzzle' | 'playground' | 'house' | 'kitchen';

export type ArtId = 'fox' | 'aiden' | 'device' | 'toothbrush' | 'foxReading' | 'shirt' | 'bowl';

export interface ChoiceOption {
  id: string;
  label: string;
  icon?: IconId;
  art?: ArtId;
  tone: Tone;
  /** Several options may be helpful — there is rarely one right answer. */
  helpful: boolean;
  /** Gentle, non-punitive response shown after choosing. */
  feedback: string;
  modality?: Modality;
  tags?: string[];
}

export interface StepEvidence {
  skillArea: SkillArea;
  templateId: string;
  tags?: string[];
}

export type MissionStep =
  | {
      id: string;
      type: 'detail';
      header: string;
      title: string;
      body: string;
      points: { icon: IconId; tone: Tone; title: string; sub: string }[];
      cta: string;
    }
  | {
      id: string;
      type: 'firstThen';
      title: string;
      subtitle: string;
      first: { art: ArtId; line1: string; line2: string };
      then: { art: ArtId; line1: string; line2: string };
      tip: string;
      cta: string;
    }
  | {
      id: string;
      type: 'scenario';
      scene: SceneId;
      text: string;
      round: number;
      rounds: number;
      cta: string;
    }
  | {
      id: string;
      type: 'story';
      title: string;
      subtitle: string;
      scene: SceneId;
      text: string;
      hint: string;
      cta: string;
    }
  | {
      id: string;
      type: 'quickChoice';
      title: string;
      options: ChoiceOption[];
      evidence: StepEvidence;
    }
  | {
      id: string;
      type: 'cardChoice';
      title: string;
      subtitle: string;
      options: ChoiceOption[];
      tip: { text: string };
      cta: string;
      evidence: StepEvidence;
    }
  | {
      id: string;
      type: 'success';
      title: string;
      message: string;
      cta: string;
      tip: string;
    }
  | {
      id: string;
      type: 'practice';
      kind: 'breathing' | 'helpSignal' | 'sequence';
      title: string;
      subtitle: string;
      heading: string;
      steps: string[];
      cta: string;
      evidence: StepEvidence;
      /** For sequence practice: acceptable orders (flexibility is welcome). */
      orders?: string[][];
    }
  | {
      id: string;
      type: 'feedback';
      title: string;
      subtitle: string;
      badges: { icon: IconId; line1: string; line2: string }[];
      tip: string;
      cta: string;
    }
  | {
      id: string;
      type: 'complete';
      title: string;
      heading: string;
      message: string;
      checks: string[];
      cta: string;
    }
  | {
      id: string;
      type: 'realWorld';
      variant: 'card' | 'family';
      title: string;
      questTitle: string;
      quest: string;
      example?: string;
      tip: string;
      cta: string;
      setting: Setting;
      evidence: StepEvidence;
    };

export type ReviewStage =
  | 'draft'
  | 'frameworkReview'
  | 'agencyReview'
  | 'accessibilityReview'
  | 'editorialReview'
  | 'qaReview'
  | 'pilotReady'
  | 'approved'
  | 'retired';

/** Framework §41 — required mission metadata. */
export interface MissionMeta {
  id: string;
  version: string;
  title: string;
  goalFamily: GoalFamily;
  skillArea: SkillArea;
  intendedGoals: string[];
  journeyModes: JourneyMode[];
  dimensions: GrowthDimension[];
  bands: PresentationBand[];
  gameEngine: GameEngine;
  world: string;
  modalities: Modality[];
  promptLevels: SupportLevel[];
  sensoryDefaults: { sound: 'soft' | 'off'; motion: 'full' | 'gentle'; celebration: 'full' | 'gentle' };
  interaction: ('tap' | 'drag' | 'speech')[];
  durationMin: [number, number];
  evidenceFields: string[];
  validityRule: string;
  contextTags: string[];
  realWorldHook: string;
  safetyFlags: string[];
  accessibility: string[];
  reviewStatus: ReviewStage;
  releaseStatus: 'draft' | 'pilot' | 'approved' | 'retired';
}

export interface Mission extends MissionMeta {
  questId: QuestId;
  summary: string;
  steps: MissionStep[];
  stars: number;
  badge: 'brave' | 'kind' | 'explorer' | 'calm' | 'helper' | 'routine';
}

export type QuestId = 'communication' | 'emotions' | 'friendships' | 'confidence' | 'independence';

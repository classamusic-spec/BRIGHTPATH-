import type { IconId, QuestId, Tone } from './types';

export interface Quest {
  id: QuestId;
  title: string;
  sub: string;
  icon: IconId;
  tone: Tone;
  missionId: string;
}

/** Child-facing quest families shown on "Choose a Quest". */
export const QUESTS: Quest[] = [
  { id: 'communication', title: 'Communication', sub: 'Share, listen, express', icon: 'heart', tone: 'blush', missionId: 'help-hero' },
  { id: 'emotions', title: 'Emotions', sub: 'Understand & manage', icon: 'chat', tone: 'mint', missionId: 'be-kind-home' },
  { id: 'friendships', title: 'Friendships', sub: 'Be kind & include others', icon: 'people', tone: 'blue', missionId: 'pip-tower' },
  { id: 'confidence', title: 'Confidence', sub: 'Try new things', icon: 'star', tone: 'butter', missionId: 'flexi-fix' },
  { id: 'independence', title: 'Independence', sub: 'Do more on my own', icon: 'mountain', tone: 'white', missionId: 'morning-road' },
];

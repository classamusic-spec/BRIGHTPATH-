/**
 * Reward economy (Framework §48): rewards participation, effort,
 * self-advocacy and exploration. Earned rewards are never removed, room items
 * unlock at star milestones (nothing is spent), and reward data is kept
 * separate from learning evidence.
 */
import type { Badge } from '@/engine/types';

export type RoomItemId = 'plant' | 'chair' | 'poster' | 'rug' | 'pet' | 'books' | 'lamp' | 'kite';

export interface RoomItem {
  id: RoomItemId;
  label: string;
  unlockAt: number;
}

export const ROOM_ITEMS: RoomItem[] = [
  { id: 'plant', label: 'Plant', unlockAt: 1 },
  { id: 'chair', label: 'Chair', unlockAt: 3 },
  { id: 'poster', label: 'Poster', unlockAt: 5 },
  { id: 'rug', label: 'Rug', unlockAt: 7 },
  { id: 'pet', label: 'Pet', unlockAt: 9 },
  { id: 'books', label: 'Books', unlockAt: 12 },
  { id: 'lamp', label: 'Lamp', unlockAt: 15 },
  { id: 'kite', label: 'Kite', unlockAt: 20 },
];

export const BADGES: Record<Badge['id'], { title: string; sub: string; icon: 'star' | 'heart' | 'sprout' | 'hand' | 'sun'; tone: 'butter' | 'blush' | 'mint' | 'sky' }> = {
  brave: { title: 'Brave', sub: 'Try again', icon: 'star', tone: 'butter' },
  kind: { title: 'Kind', sub: 'Be helpful', icon: 'heart', tone: 'blush' },
  explorer: { title: 'Explorer', sub: 'Be curious', icon: 'sprout', tone: 'mint' },
  calm: { title: 'Calm', sub: 'Take a breath', icon: 'sprout', tone: 'mint' },
  helper: { title: 'Helper', sub: 'Ask your way', icon: 'hand', tone: 'sky' },
  routine: { title: 'Routine Star', sub: 'Step by step', icon: 'sun', tone: 'butter' },
};

/** Why stars are given — shown to adults, never to compare children. */
export const STAR_REASONS = {
  mission: 'Finished a mission',
  tryAgain: 'Tried again (by choice)',
  selfAdvocacy: 'Used a My Tools card',
  explore: 'Explored something new',
  realWorld: 'Accepted a Real-World Quest',
  checkIn: 'Shared how they feel',
};

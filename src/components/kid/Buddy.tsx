import { GUIDE } from '@/content/cast';
import type { BuddyId } from '@/engine/types';
import type { MotionLevel } from '@/lib/motion';

import { Pip, Roo, Tilly, type BuddyMood } from '../characters/Buddies';
import { Fox } from '../characters/fox/Fox';

export const BUDDIES: { id: BuddyId; name: string; tone: 'orange' | 'blue' | 'mint' | 'butter'; bg: string; line: string }[] = [
  { id: GUIDE.id, name: GUIDE.name, tone: 'orange', bg: '#FDEFE2', line: 'I love maps and big adventures!' },
  { id: 'pip', name: 'Pip', tone: 'blue', bg: '#E3EBFB', line: 'I love building towers!' },
  { id: 'tilly', name: 'Tilly', tone: 'mint', bg: '#DDF3E3', line: 'I like to go slow and steady.' },
  { id: 'roo', name: 'Roo', tone: 'butter', bg: '#FBE9DA', line: 'I love playing fetch with friends!' },
];

export function buddyName(id: BuddyId): string {
  return BUDDIES.find((b) => b.id === id)?.name ?? GUIDE.name;
}

/**
 * Portrait of any buddy (the guide fox uses the full rig in bust pose).
 * `mood: 'happy'` gives every buddy a smiling look (the fox switches to joy).
 */
export function BuddyPortrait({ id, size = 120, motion, wave = true, mood, decorative }: { id: BuddyId; size?: number; motion?: MotionLevel; wave?: boolean; mood?: BuddyMood; decorative?: boolean }) {
  switch (id) {
    case 'pip':
      return <Pip size={size} motion={motion} mood={mood} decorative={decorative} />;
    case 'tilly':
      return <Tilly size={size} motion={motion} mood={mood} decorative={decorative} />;
    case 'roo':
      return <Roo size={size} motion={motion} mood={mood} decorative={decorative} />;
    default:
      return <Fox pose="bust" size={size} wavePaw={wave} motion={motion} interactive={false} decorative={decorative} expression={mood === 'happy' ? 'joy' : undefined} />;
  }
}

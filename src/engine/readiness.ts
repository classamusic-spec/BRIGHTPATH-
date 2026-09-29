/**
 * Readiness Check (Framework §10). The child's choice is a request about how
 * the session should feel — never a diagnosis or an inferred internal state.
 */
import type { Feeling, Readiness } from './types';

export const FEELING_TO_READINESS: Record<Feeling, Readiness> = {
  happy: 'ready',
  okay: 'ready',
  calm: 'quiet',
  sad: 'littleOff',
  worried: 'littleOff',
  tired: 'needBreak',
};

export interface SessionEffects {
  /** Reduce sensory load (fewer distractors, softer celebration). */
  quiet: boolean;
  /** Offer a movement break first. */
  offerMove: boolean;
  /** Shorter missions, one more support step, less novelty. */
  gentle: boolean;
  /** Offer Calm Space or All Done up front (no penalty). */
  offerBreak: boolean;
  /** Fox line shown after the check-in. */
  message: string;
}

export function sessionEffects(r: Readiness): SessionEffects {
  switch (r) {
    case 'quiet':
      return { quiet: true, offerMove: false, gentle: false, offerBreak: false, message: 'Nice and calm. We’ll keep things quiet today.' };
    case 'moveFirst':
      return { quiet: false, offerMove: true, gentle: false, offerBreak: false, message: 'Let’s wiggle first, then play!' };
    case 'littleOff':
      return { quiet: true, offerMove: false, gentle: true, offerBreak: true, message: 'Thanks for telling me. We can go slow, or visit Calm Space first.' };
    case 'needBreak':
      return { quiet: true, offerMove: false, gentle: true, offerBreak: true, message: 'Rest is okay. Want Calm Space, or all done for now?' };
    case 'ready':
    default:
      return { quiet: false, offerMove: false, gentle: false, offerBreak: false, message: 'Yay! Let’s explore together.' };
  }
}

import { useReducedMotion } from 'react-native-reanimated';

import { selectLearner, useApp } from '@/store';

export type MotionLevel = 'full' | 'gentle' | 'off';

/**
 * How much ambient motion to play. The OS "Reduce Motion" setting always
 * wins; otherwise the learner's sensory profile decides, and a Quiet session
 * (from the Readiness Check or My Tools) softens full motion to gentle.
 */
export function useMotionLevel(override?: MotionLevel): MotionLevel {
  const osReduced = useReducedMotion();
  const pref = useApp((s) => {
    const a = selectLearner(s)?.access.sensory.animation ?? 'full';
    return s.session.quiet && a === 'full' ? 'gentle' : a;
  });
  if (override) return override;
  if (osReduced) return 'off';
  return pref;
}

/** Celebration intensity (confetti, stars, jumps). */
export function useCelebration(): 'full' | 'gentle' | 'minimal' {
  const level = useMotionLevel();
  const pref = useApp((s) => selectLearner(s)?.access.sensory.celebration ?? 'full');
  if (level === 'off') return 'minimal';
  if (level === 'gentle' && pref === 'full') return 'gentle';
  return pref;
}

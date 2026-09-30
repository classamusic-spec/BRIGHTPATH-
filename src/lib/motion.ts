import { useIsFocused } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import type { AccessProfile } from '@/engine/types';
import { selectLearner, useApp } from '@/store';

export type MotionLevel = 'full' | 'gentle' | 'off';

/*
 * Live OS "Reduce Motion". A tiny module store, seeded once and kept current
 * by the platform listener, so every screen reacts without a reload.
 */
let osReduced = false;
let started = false;
const listeners = new Set<() => void>();

function setReduced(v: boolean) {
  if (v === osReduced) return;
  osReduced = v;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    osReduced = mq.matches;
    mq.addEventListener?.('change', (e) => setReduced(e.matches));
    return;
  }
  AccessibilityInfo.isReduceMotionEnabled()
    .then(setReduced)
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getReduced = () => osReduced;

/** True while the OS asks for reduced motion (live). */
export function useOsReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getReduced, () => false);
}

/** The active learner's access profile (may be undefined before hydration). */
export function useAccess(): AccessProfile | undefined {
  return useApp((s) => selectLearner(s)?.access);
}

/**
 * How much ambient motion to play. The OS "Reduce Motion" setting always
 * wins; otherwise the learner's sensory profile decides, and a Quiet session
 * (from the Readiness Check or My Tools) softens full motion to gentle.
 */
export function useMotionLevel(override?: MotionLevel): MotionLevel {
  const reduced = useOsReducedMotion();
  const pref = useApp((s) => {
    const a = selectLearner(s)?.access?.sensory?.animation ?? 'full';
    return s.session.quiet && a === 'full' ? 'gentle' : a;
  });
  if (override) return override;
  if (reduced) return 'off';
  return pref;
}

/**
 * Whether looping background motion (clouds, water, idle sway) should run:
 * motion is on, the screen is focused, and the learner has not turned
 * background motion off.
 */
export function useAmbientMotion(): boolean {
  const level = useMotionLevel();
  const focused = useIsFocused();
  const bg = useApp((s) => selectLearner(s)?.access?.sensory?.backgroundMotion !== false);
  return level !== 'off' && focused && bg;
}

/** Celebration intensity (confetti, stars, jumps). */
export function useCelebration(): 'full' | 'gentle' | 'minimal' {
  const level = useMotionLevel();
  const pref = useApp((s) => selectLearner(s)?.access?.sensory?.celebration ?? 'full');
  if (level === 'off') return 'minimal';
  if (level === 'gentle' && pref === 'full') return 'gentle';
  return pref;
}

/** Stack transition for the current motion level. */
export function stackAnimation(level: MotionLevel): 'none' | 'fade' | 'slide_from_right' {
  return level === 'off' ? 'none' : level === 'gentle' ? 'fade' : 'slide_from_right';
}

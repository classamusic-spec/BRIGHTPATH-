import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { selectLearner, useApp } from '@/store';

/** Haptic feedback honouring the learner's sensory profile. */
function enabled(): boolean {
  if (Platform.OS === 'web') return false;
  const s = useApp.getState();
  return (selectLearner(s)?.access?.sensory?.haptics ?? true) && !s.session.quiet;
}

/*
 * One buzz per tap: a Tap fires its light tap haptic and the screen may add a
 * selection or success on the same press. Within a short window only a
 * stronger kind gets through.
 */
const WINDOW_MS = 120;
let last = { t: 0, rank: 0 };

function claim(rank: number): boolean {
  const now = Date.now();
  if (now - last.t < WINDOW_MS && rank <= last.rank) return false;
  last = { t: now, rank };
  return true;
}

export function tapHaptic() {
  if (!enabled() || !claim(2)) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function selectHaptic() {
  if (!enabled() || !claim(1)) return;
  Haptics.selectionAsync().catch(() => {});
}

export function successHaptic() {
  if (!enabled() || !claim(3)) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

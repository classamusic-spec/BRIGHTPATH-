import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { selectLearner, useApp } from '@/store';

/** Haptic feedback honouring the learner's sensory profile. */
function enabled(): boolean {
  if (Platform.OS === 'web') return false;
  const s = useApp.getState();
  return (selectLearner(s)?.access.sensory.haptics ?? true) && !s.session.quiet;
}

export function tapHaptic() {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function selectHaptic() {
  if (!enabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function successHaptic() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

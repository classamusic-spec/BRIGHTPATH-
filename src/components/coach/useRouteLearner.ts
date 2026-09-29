import { useLocalSearchParams } from 'expo-router';

import type { Learner } from '@/engine/types';
import { selectLearner, useApp } from '@/store';

/** Learner for a /coach/learner/[id] route (falls back to the active learner). */
export function useRouteLearner(): Learner {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return useApp((s) => s.learners.find((l) => l.id === id) ?? selectLearner(s));
}

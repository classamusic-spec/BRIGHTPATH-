import { useLocalSearchParams } from 'expo-router';

import type { Learner } from '@/engine/types';
import { selectLearner, useApp } from '@/store';

/**
 * Learner for a /coach/learner/[id] route. Without an id it falls back to the
 * active learner; an unknown id gives null so the screen can say "not found"
 * instead of quietly showing someone else's data.
 */
export function useRouteLearner(): Learner | null {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return useApp((s) => (id ? (s.learners.find((l) => l.id === id) ?? null) : (selectLearner(s) ?? null)));
}

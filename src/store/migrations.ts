import { LEGACY_BUDDY_IDS } from '@/content/cast';
import type { Learner } from '@/engine/types';

/** Current persisted-data version (see `persist` in store/index.ts). */
export const STORE_VERSION = 3;

/**
 * Upgrades data saved by older app versions. v3 renamed the guide fox, so a
 * learner who picked the fox keeps the fox.
 */
export function migrateStore<T extends { learners?: Learner[] }>(data: T, fromVersion: number): T {
  if (fromVersion < 3 && Array.isArray(data.learners)) {
    return {
      ...data,
      learners: data.learners.map((l) => ({ ...l, buddy: (LEGACY_BUDDY_IDS[l.buddy as string] ?? l.buddy) as Learner['buddy'] })),
    };
  }
  return data;
}

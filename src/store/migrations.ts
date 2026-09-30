import { LEGACY_BUDDY_IDS } from '@/content/cast';
import type { AccessProfile, Learner } from '@/engine/types';

import { DEFAULT_ACCESS } from './defaults';

/** Current persisted-data version (see `persist` in store/index.ts). */
export const STORE_VERSION = 4;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Fills settings added after the profile was saved; saved choices always win. */
function withDefaults<T>(defaults: T, saved: unknown): T {
  if (!isObject(defaults) || !isObject(saved)) return (saved === undefined ? defaults : saved) as T;
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(saved)) out[k] = k in defaults ? withDefaults((defaults as Record<string, unknown>)[k], v) : v;
  return out as T;
}

/**
 * Upgrades data saved by older app versions.
 * - v3 renamed the guide fox, so a learner who picked the fox keeps the fox.
 * - v4 fills access settings added since the learner's profile was saved.
 */
export function migrateStore<T extends { learners?: Learner[] }>(data: T, fromVersion: number): T {
  let out = data;
  if (fromVersion < 3 && Array.isArray(out.learners)) {
    out = {
      ...out,
      learners: out.learners.map((l) => ({ ...l, buddy: (LEGACY_BUDDY_IDS[l.buddy as string] ?? l.buddy) as Learner['buddy'] })),
    };
  }
  if (fromVersion < 4 && Array.isArray(out.learners) && out.learners.some((l) => isObject(l.access))) {
    out = {
      ...out,
      learners: out.learners.map((l) => (isObject(l.access) ? { ...l, access: withDefaults<AccessProfile>(DEFAULT_ACCESS, l.access) } : l)),
    };
  }
  return out;
}

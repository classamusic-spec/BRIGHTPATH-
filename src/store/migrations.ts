import { LEGACY_BUDDY_IDS } from '@/content/cast';
import type { AccessProfile, Learner } from '@/engine/types';

import { DEFAULT_ACCESS } from './defaults';
import { DEMO_CHILD_ID, demoTalk } from './seed';
import type { TalkPrefs } from './talk';

/** Current persisted-data version (see `persist` in store/index.ts). */
export const STORE_VERSION = 6;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Fills settings added after the profile was saved; saved choices always win. */
function withDefaults<T>(defaults: T, saved: unknown): T {
  if (!isObject(defaults) || !isObject(saved)) return (saved === undefined ? defaults : saved) as T;
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(saved)) out[k] = k in defaults ? withDefaults((defaults as Record<string, unknown>)[k], v) : v;
  return out as T;
}

/** Ids of the demo family's main child before and after the rename to Gabriel (v5). */
const DEMO_ID_RENAMES: Record<string, string> = { 'learner-alex': 'learner-gabriel', 'plan-alex-1': 'plan-gabriel-1' };

/** Renames the demo child everywhere in demo data: ids (values and keys) and the name in text. */
function renameDemoChild(value: unknown): unknown {
  if (typeof value === 'string') return DEMO_ID_RENAMES[value] ?? value.replace(/\bAlex\b/g, 'Gabriel');
  if (Array.isArray(value)) return value.map(renameDemoChild);
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[DEMO_ID_RENAMES[k] ?? k] = renameDemoChild(v);
    return out;
  }
  return value;
}

/**
 * Upgrades data saved by older app versions.
 * - v3 renamed the guide fox, so a learner who picked the fox keeps the fox.
 * - v4 fills access settings added since the learner's profile was saved.
 * - v5 renamed the demo family's main child from Alex to Gabriel. Only demo
 *   data is touched: a real family's child called Alex keeps their name.
 * - v6 added the Talk board. Demo data gets Gabriel's own words; everyone
 *   else starts from the defaults.
 */
export function migrateStore<T extends { learners?: Learner[]; demoData?: boolean; talk?: Record<string, TalkPrefs> }>(data: T, fromVersion: number): T {
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
  if (fromVersion < 5 && out.demoData === true) out = renameDemoChild(out) as T;
  if (fromVersion < 6 && out.demoData === true && !out.talk?.[DEMO_CHILD_ID]) {
    out = { ...out, talk: { ...out.talk, [DEMO_CHILD_ID]: demoTalk() } };
  }
  return out;
}

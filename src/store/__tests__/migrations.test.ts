import { GUIDE } from '@/content/cast';
import type { Learner } from '@/engine/types';

import { migrateStore } from '../migrations';

const learner = (buddy: string) => ({ id: `l-${buddy}`, displayName: 'Test', buddy }) as unknown as Learner;

describe('store migrations', () => {
  it('keeps the fox for learners who chose it before the rename', () => {
    const out = migrateStore({ learners: [learner('finn'), learner('pip')] }, 2);
    expect(out.learners?.map((l) => l.buddy)).toEqual([GUIDE.id, 'pip']);
  });

  it('leaves current data untouched', () => {
    const data = { learners: [learner(GUIDE.id)] };
    expect(migrateStore(data, 3)).toBe(data);
  });

  it('tolerates data without learners', () => {
    expect(migrateStore({}, 1)).toEqual({});
  });
});

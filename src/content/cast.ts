/**
 * The guide character. Change the name here and every screen, spoken line
 * and mission follows. The id is stored with each learner's buddy choice.
 */
export const GUIDE = { id: 'maple', name: 'Maple', species: 'fox' } as const;

/** Buddy ids used before the guide was renamed; mapped on load. */
export const LEGACY_BUDDY_IDS: Record<string, typeof GUIDE.id> = { finn: GUIDE.id };

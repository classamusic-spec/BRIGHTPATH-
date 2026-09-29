import { useId, useMemo } from 'react';

/**
 * Stable, DOM-safe unique id prefix. SVG gradient ids must be unique per
 * instance because every inline <svg> on web shares one id namespace.
 */
export function useUid(prefix = 'u'): string {
  const raw = useId();
  return useMemo(() => `${prefix}${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`, [prefix, raw]);
}

/**
 * Context Matrix (Framework §36): how a learner's skills show up across
 * settings. Every label links back to the raw observations behind it, and
 * "Not enough evidence" is shown instead of guessing.
 */
import { outcomeScore } from './evidence';
import { SETTINGS, SKILL_AREAS, type Observation, type Setting, type SkillArea } from './types';

export type CellStatus = 'strong' | 'growing' | 'some' | 'needs' | 'none';

export interface MatrixCell {
  area: SkillArea;
  setting: Setting;
  status: CellStatus;
  score: number;
  valid: number;
  observationIds: string[];
}

export const CELL_LABEL: Record<CellStatus, string> = {
  strong: 'Doing well',
  growing: 'Growing',
  some: 'With some support',
  needs: 'More support helps here',
  none: 'Not enough evidence',
};

export function cellStatus(score: number, valid: number): CellStatus {
  if (valid < 4) return 'none';
  if (score >= 0.8 && valid >= 4) return 'strong';
  if (score >= 0.62) return 'growing';
  if (score >= 0.38) return 'some';
  return 'needs';
}

export function contextMatrix(observations: Observation[], since?: Date): MatrixCell[][] {
  const rows: MatrixCell[][] = [];
  for (const area of SKILL_AREAS) {
    const row: MatrixCell[] = [];
    for (const setting of SETTINGS) {
      const obs = observations.filter(
        (o) =>
          o.skillArea === area &&
          o.context.setting === setting &&
          o.quality === 'valid' &&
          o.outcome !== 'accessLimited' &&
          (!since || new Date(o.at) >= since),
      );
      const score = obs.length ? obs.reduce((sum, o) => sum + outcomeScore(o), 0) / obs.length : 0;
      row.push({ area, setting, status: cellStatus(score, obs.length), score, valid: obs.length, observationIds: obs.map((o) => o.id) });
    }
    rows.push(row);
  }
  return rows;
}

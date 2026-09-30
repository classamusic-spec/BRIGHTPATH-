/**
 * In-memory state for the mission currently being played. Kept out of the
 * persisted store: it only lives while a mission is open.
 */
import { create } from 'zustand';

import type { AgencyTool, JourneyMode, SupportLevel } from '@/engine/types';

export interface MissionSession {
  runId?: string;
  missionId?: string;
  goalId?: string;
  mode: JourneyMode;
  supportLevel: SupportLevel;
  stepStartedAt: number;
  tools: AgencyTool[];
  /** Increments when the learner taps Help — steps respond with a hint. */
  helpSignal: number;
  toolStarGiven: boolean;
  /** `${runId}:${stepId}` keys that already produced an observation this run. */
  recorded: Record<string, true>;
  /** True while a choice step with options is on screen (My Tools reads it). */
  hasOptions: boolean;
  /** Stars and badge awarded when the run was marked complete (for the room). */
  awarded?: { stars: number; badge?: string };
  begin: (p: { runId: string; missionId: string; goalId?: string; mode: JourneyMode; supportLevel: SupportLevel }) => void;
  startStep: () => void;
  useTool: (t: AgencyTool) => void;
  requestHelp: () => void;
  markToolStar: () => void;
  /** Marks a step as recorded; returns false when it already was this run. */
  markRecorded: (stepId: string) => boolean;
  setHasOptions: (v: boolean) => void;
  setAwarded: (a: { stars: number; badge?: string }) => void;
  end: () => void;
}

export const useMission = create<MissionSession>((set, get) => ({
  mode: 'discover',
  supportLevel: 5,
  stepStartedAt: Date.now(),
  tools: [],
  helpSignal: 0,
  toolStarGiven: false,
  recorded: {},
  hasOptions: false,
  begin: (p) => set({ ...p, stepStartedAt: Date.now(), tools: [], helpSignal: 0, toolStarGiven: false, recorded: {}, awarded: undefined }),
  startStep: () => set({ stepStartedAt: Date.now(), tools: [] }),
  useTool: (t) => set((s) => ({ tools: s.tools.includes(t) ? s.tools : [...s.tools, t] })),
  requestHelp: () => set((s) => ({ helpSignal: s.helpSignal + 1, tools: s.tools.includes('help') ? s.tools : [...s.tools, 'help'] })),
  markToolStar: () => set({ toolStarGiven: true }),
  markRecorded: (stepId) => {
    const key = `${get().runId ?? 'none'}:${stepId}`;
    if (get().recorded[key]) return false;
    set((s) => ({ recorded: { ...s.recorded, [key]: true } }));
    return true;
  },
  setHasOptions: (v) => set({ hasOptions: v }),
  setAwarded: (a) => set({ awarded: a }),
  end: () => set({ runId: undefined, missionId: undefined, goalId: undefined, tools: [], helpSignal: 0, recorded: {}, hasOptions: false, awarded: undefined }),
}));

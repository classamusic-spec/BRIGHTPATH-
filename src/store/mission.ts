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
  begin: (p: { runId: string; missionId: string; goalId?: string; mode: JourneyMode; supportLevel: SupportLevel }) => void;
  startStep: () => void;
  useTool: (t: AgencyTool) => void;
  requestHelp: () => void;
  markToolStar: () => void;
  end: () => void;
}

export const useMission = create<MissionSession>((set) => ({
  mode: 'discover',
  supportLevel: 5,
  stepStartedAt: Date.now(),
  tools: [],
  helpSignal: 0,
  toolStarGiven: false,
  begin: (p) => set({ ...p, stepStartedAt: Date.now(), tools: [], helpSignal: 0, toolStarGiven: false }),
  startStep: () => set({ stepStartedAt: Date.now(), tools: [] }),
  useTool: (t) => set((s) => ({ tools: s.tools.includes(t) ? s.tools : [...s.tools, t] })),
  requestHelp: () => set((s) => ({ helpSignal: s.helpSignal + 1, tools: s.tools.includes('help') ? s.tools : [...s.tools, 'help'] })),
  markToolStar: () => set({ toolStarGiven: true }),
  end: () => set({ runId: undefined, missionId: undefined, goalId: undefined, tools: [], helpSignal: 0 }),
}));

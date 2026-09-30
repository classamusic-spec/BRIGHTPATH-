import { create } from 'zustand';

/** How long a solved Parent Gate keeps the grown-up space open. */
export const GATE_UNLOCK_MS = 10 * 60 * 1000;

/**
 * Parent Gate state. Deliberately not persisted: a fresh launch, or the app
 * going to the background, always asks again.
 */
export const useGate = create<{ until: number; unlock: () => void; lock: () => void }>((set) => ({
  until: 0,
  unlock: () => set({ until: Date.now() + GATE_UNLOCK_MS }),
  lock: () => set({ until: 0 }),
}));

export const isGateOpen = (until: number = useGate.getState().until) => Date.now() <= until;

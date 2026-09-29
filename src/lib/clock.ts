import { useSyncExternalStore } from 'react';

/**
 * A shared, minute-resolution clock. Reading it during render is pure (the
 * value only changes when the clock ticks), which keeps date maths in hooks
 * and components deterministic.
 */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    // Catch up after the clock was idle (no screen was using it).
    now = Date.now();
    timer = setInterval(tick, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const snapshot = () => now;

/** Current time in milliseconds, refreshed every minute. */
export function useClock(): number {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

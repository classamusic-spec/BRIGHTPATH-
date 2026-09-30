import { useEffect, useRef } from 'react';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const sine = Easing.inOut(Easing.sin);

/** 0 → 1 → 0 … forever (ping-pong). Rests at `rest` when disabled. */
export function useOscillator(
  enabled: boolean,
  duration: number,
  { delay = 0, rest = 0 }: { delay?: number; rest?: number } = {},
): SharedValue<number> {
  const v = useSharedValue(rest);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(v);
      v.value = withTiming(rest, { duration: 300 });
      return;
    }
    v.value = 0;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: sine }), -1, true));
    return () => cancelAnimation(v);
  }, [enabled, duration, delay, rest, v]);
  return v;
}

/** Linear phase 0 → 1 repeating (for cycles such as walking). */
export function usePhase(enabled: boolean, duration: number): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 250 });
      return;
    }
    v.value = 0;
    v.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(v);
  }, [enabled, duration, v]);
  return v;
}

function jitter(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Natural blinking: 1 = open, 0 = closed, with the odd double-blink.
 * 'slow' keeps a rare, gentle blink (every 6–9 s) for reduced motion so the
 * character never looks frozen.
 */
export function useBlink(enabled: boolean, mode: 'normal' | 'slow' = 'normal'): SharedValue<number> {
  const v = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled) {
      v.value = 1;
      return;
    }
    let alive = true;
    const slow = mode === 'slow';
    const schedule = () => {
      timer.current = setTimeout(() => {
        if (!alive) return;
        const close = withTiming(0, { duration: slow ? 110 : 70, easing: Easing.in(Easing.quad) });
        const open = withTiming(1, { duration: slow ? 180 : 120, easing: Easing.out(Easing.quad) });
        v.value =
          !slow && Math.random() < 0.22
            ? withSequence(close, open, withDelay(90, withTiming(0, { duration: 70 })), open)
            : withSequence(close, open);
        schedule();
      }, slow ? jitter(6000, 9000) : jitter(2200, 5200));
    };
    schedule();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, mode, v]);
  return v;
}

/** Occasional quick twitch (ears, whiskers): 0 → 1 → -0.35 → 0. */
export function useTwitch(enabled: boolean, minMs = 2600, maxMs = 6800): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      v.value = 0;
      return;
    }
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!alive) return;
        v.value = withSequence(
          withTiming(1, { duration: 85 }),
          withTiming(-0.35, { duration: 95 }),
          withTiming(0.15, { duration: 90 }),
          withTiming(0, { duration: 140 }),
        );
        schedule();
      }, jitter(minMs, maxMs));
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [enabled, minMs, maxMs, v]);
  return v;
}

/** Friendly wave: bursts of 2–3 swings with a rest in between. */
export function useWave(enabled: boolean, gentle = false): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 300 });
      return;
    }
    const swing = gentle ? 520 : 240;
    const burst = withSequence(
      withTiming(1, { duration: swing, easing: sine }),
      withTiming(-0.5, { duration: swing, easing: sine }),
      withTiming(1, { duration: swing, easing: sine }),
      withTiming(-0.5, { duration: swing, easing: sine }),
      withTiming(0.6, { duration: swing, easing: sine }),
      withTiming(0.2, { duration: 380, easing: sine }),
      withDelay(gentle ? 2600 : 1500, withTiming(0.2, { duration: 10 })),
    );
    v.value = withRepeat(burst, -1, false);
    return () => cancelAnimation(v);
  }, [enabled, gentle, v]);
  return v;
}

/**
 * Hop used by celebration poses: -0.25 crouch → 1 apex → land. Repeats `count`
 * times (-1 = forever) and then rests on the ground.
 */
export function useHop(enabled: boolean, period = 1100, rest = 700, count = -1): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 250 });
      return;
    }
    v.value = withRepeat(
      withSequence(
        withTiming(-0.25, { duration: period * 0.12, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: period * 0.3, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: period * 0.38, easing: Easing.in(Easing.quad) }),
        withTiming(-0.35, { duration: period * 0.1, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: period * 0.1 }),
        withDelay(rest, withTiming(0, { duration: 10 })),
      ),
      count,
      false,
    );
    return () => cancelAnimation(v);
  }, [enabled, period, rest, count, v]);
  return v;
}

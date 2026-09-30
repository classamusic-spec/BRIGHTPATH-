import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useAmbientMotion, useMotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

import { BlueCloud, Bush, CloudShape, SCENE, SunDisk, SunRays, Tree } from './elements';
import { useSeedSize } from './Stage';

export type TreeSpec = { x: number; base: number; h: number; tone?: 'teal' | 'light' | 'deep' };
export type CloudSpec = { x: number; y: number; s?: number };
export type BushSpec = { x: number; base: number; s?: number; tone?: 'mid' | 'deep' | 'light' };

export type LandscapeSpec = {
  skyTop?: string;
  skyBottom?: string;
  /** Fraction of height where the far hills begin. */
  horizon?: number;
  /** Fraction of height where the near (foreground) hill begins. */
  ground?: number;
  mountains?: boolean;
  trees?: TreeSpec[];
  clouds?: CloudSpec[];
  bushes?: BushSpec[];
  sun?: { x: number; y: number; r: number; cloud?: boolean };
  groundColor?: string;
};

function useDrift(enabled: boolean, distance: number, duration: number, delay: number) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(v);
      v.value = 0;
      return;
    }
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [enabled, duration, delay, v]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: (v.value - 0.5) * distance }] }));
}

function useSway(enabled: boolean, deg: number, duration: number, delay: number) {
  const v = useSharedValue(0.5);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(v);
      v.value = 0.5;
      return;
    }
    v.value = 0;
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(v);
  }, [enabled, duration, delay, v]);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${(v.value - 0.5) * 2 * deg}deg` }] }));
}

export function Cloud({ left, top, s = 1, index = 0 }: { left: number; top: number; s?: number; index?: number }) {
  const style = useDrift(useAmbientMotion(), 16 * s, 7000 + index * 1300, index * 600);
  const w = 100 * s;
  const h = 34 * s;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: left - w / 2, top: top - h / 2, width: w, height: h }, style]}>
      <Svg width="100%" height="100%" viewBox="-50 -30 100 44">
        <CloudShape x={0} y={0} s={1} />
      </Svg>
    </Animated.View>
  );
}

export function SwayTree({ left, bottom, h, tone = 'teal', index = 0 }: { left: number; bottom: number; h: number; tone?: 'teal' | 'light' | 'deep'; index?: number }) {
  const level = useMotionLevel();
  const style = useSway(useAmbientMotion() && level === 'full', 1.6, 2600 + (index % 4) * 450, (index % 5) * 300);
  const w = h * 0.62;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: left - w / 2, top: bottom - h, width: w, height: h, transformOrigin: '50% 100%' }, style]}>
      <Svg width="100%" height="100%" viewBox={`${-w / 2} ${-h} ${w} ${h}`}>
        <Tree x={0} y={0} h={h} tone={tone} />
      </Svg>
    </Animated.View>
  );
}

export function Sun({ size = 90, cloud = false, style }: { size?: number; cloud?: boolean; style?: StyleProp<ViewStyle> }) {
  const on = useAmbientMotion();
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!on) {
      cancelAnimation(spin);
      return;
    }
    // Resume from wherever the rays stopped so they never jump.
    const from = spin.value % 1;
    spin.value = from;
    spin.value = withRepeat(withTiming(from + 1, { duration: 24000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [on, spin]);
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const r = 28;
  const box = size;
  return (
    <View pointerEvents="none" style={[{ width: box, height: cloud ? box * 0.78 : box }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { height: box }, rays]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <SunRays cx={50} cy={50} r={r} count={10} len={0.42} width={0.12} />
        </Svg>
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { height: box }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <SunDisk cx={50} cy={50} r={r} />
          {cloud && <BlueCloud cx={52} cy={70} w={72} />}
        </Svg>
      </View>
    </View>
  );
}

/**
 * Responsive landscape backdrop. Sky, hills and grass stretch to any size;
 * trees, bushes and clouds are placed by fraction so they stay grounded on
 * every phone. Ambient motion respects the learner's sensory profile.
 */
export function Landscape({
  spec,
  style,
  initialSize,
  children,
}: {
  spec: LandscapeSpec;
  style?: StyleProp<ViewStyle>;
  /** Size to place props with before the first layout ('window' for full-screen backdrops). */
  initialSize?: { w: number; h: number } | 'window';
  children?: ReactNode;
}) {
  const seed = useSeedSize(style, initialSize);
  const [measured, setSize] = useState<{ w: number; h: number } | null>(null);
  const size = measured ?? seed;
  const id = useUid('ls');
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!measured || Math.abs(measured.w - width) > 1 || Math.abs(measured.h - height) > 1) setSize({ w: width, h: height });
  };
  const {
    skyTop = SCENE.skyTop,
    skyBottom = SCENE.skyBottom,
    horizon = 0.5,
    ground = 0.62,
    mountains = false,
    trees = [],
    clouds = [],
    bushes = [],
    sun,
    groundColor = SCENE.grass,
  } = spec;
  return (
    <View style={[styles.fill, style]} onLayout={onLayout} pointerEvents="box-none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyBottom} />
          </LinearGradient>
          <LinearGradient id={`${id}grass`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={groundColor} />
            <Stop offset="1" stopColor={SCENE.hillNear} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${id}sky)`} />
        <G>
          {mountains && (
            <Path
              d={`M 0 ${horizon * 100 + 4} L 14 ${horizon * 100 - 10} L 26 ${horizon * 100 - 2} L 40 ${horizon * 100 - 16} L 56 ${horizon * 100 - 1} L 70 ${horizon * 100 - 13} L 86 ${horizon * 100 - 3} L 100 ${horizon * 100 - 11} L 100 100 L 0 100 Z`}
              fill={SCENE.mountainLight}
            />
          )}
          <Path
            d={`M 0 ${horizon * 100 + 6} C 18 ${horizon * 100 - 4} 34 ${horizon * 100 - 2} 50 ${horizon * 100 + 4} C 66 ${horizon * 100 + 10} 82 ${horizon * 100 - 6} 100 ${horizon * 100} L 100 100 L 0 100 Z`}
            fill={SCENE.hillFar}
          />
          <Path
            d={`M 0 ${ground * 100 + 2} C 22 ${ground * 100 - 8} 44 ${ground * 100 - 6} 62 ${ground * 100 + 1} C 78 ${ground * 100 + 7} 90 ${ground * 100 + 2} 100 ${ground * 100 - 2} L 100 100 L 0 100 Z`}
            fill={SCENE.hillMid}
          />
          <Path
            d={`M 0 ${ground * 100 + 12} C 26 ${ground * 100 + 4} 60 ${ground * 100 + 2} 100 ${ground * 100 + 10} L 100 100 L 0 100 Z`}
            fill={`url(#${id}grass)`}
          />
        </G>
      </Svg>
      {size && (
        <>
          {sun && (
            <Sun size={sun.r} cloud={sun.cloud} style={{ position: 'absolute', left: sun.x * size.w - sun.r / 2, top: sun.y * size.h - sun.r / 2 }} />
          )}
          {clouds.map((c, i) => (
            <Cloud key={`c${i}`} left={c.x * size.w} top={c.y * size.h} s={c.s ?? 1} index={i} />
          ))}
          {trees.map((t, i) => (
            <SwayTree key={`t${i}`} left={t.x * size.w} bottom={t.base * size.h} h={t.h} tone={t.tone} index={i} />
          ))}
          {bushes.length > 0 && (
            <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} pointerEvents="none">
              {bushes.map((b, i) => (
                <Bush key={`b${i}`} x={b.x * size.w} y={b.base * size.h} s={b.s ?? 1} tone={b.tone} />
              ))}
            </Svg>
          )}
        </>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: 'hidden' },
});

/** Presets tuned to match the v2 reference boards. */
export const LANDSCAPES = {
  splash: {
    horizon: 0.52,
    ground: 0.66,
    clouds: [
      { x: 0.16, y: 0.12, s: 0.9 },
      { x: 0.86, y: 0.1, s: 0.85 },
      { x: 0.12, y: 0.42, s: 0.8 },
      { x: 0.88, y: 0.46, s: 0.75 },
    ],
    trees: [
      { x: 0.08, base: 0.64, h: 150 },
      { x: 0.2, base: 0.6, h: 88, tone: 'light' },
      { x: 0.9, base: 0.67, h: 130 },
      { x: 0.78, base: 0.66, h: 76, tone: 'light' },
    ],
    bushes: [
      { x: 0.06, base: 0.8, s: 1.4, tone: 'deep' },
      { x: 0.95, base: 0.78, s: 1.3, tone: 'deep' },
    ],
  },
  gate: {
    horizon: 0.44,
    ground: 0.6,
    clouds: [
      { x: 0.1, y: 0.1, s: 0.8 },
      { x: 0.88, y: 0.12, s: 0.8 },
      { x: 0.1, y: 0.28, s: 0.6 },
      { x: 0.92, y: 0.3, s: 0.6 },
    ],
    trees: [
      { x: 0.06, base: 0.56, h: 150 },
      { x: 0.16, base: 0.65, h: 76, tone: 'light' },
      { x: 0.92, base: 0.52, h: 140 },
      { x: 0.86, base: 0.7, h: 120 },
      { x: 0.04, base: 0.72, h: 90 },
    ],
  },
  meadow: {
    horizon: 0.46,
    ground: 0.6,
    clouds: [
      { x: 0.14, y: 0.16, s: 0.7 },
      { x: 0.86, y: 0.2, s: 0.75 },
    ],
    trees: [
      { x: 0.1, base: 0.72, h: 110 },
      { x: 0.9, base: 0.7, h: 120 },
      { x: 0.8, base: 0.66, h: 70, tone: 'light' },
    ],
    bushes: [
      { x: 0.1, base: 0.92, s: 1.1, tone: 'deep' },
      { x: 0.9, base: 0.94, s: 1.2, tone: 'deep' },
    ],
  },
} satisfies Record<string, LandscapeSpec>;

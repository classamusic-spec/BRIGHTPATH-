import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { GUIDE } from '@/content/cast';
import { tapHaptic } from '@/lib/feedback';
import { useAmbientMotion, useCelebration, useMotionLevel, type MotionLevel } from '@/lib/motion';
import { useSpeaking } from '@/lib/speech';
import { useUid } from '@/lib/uid';

import { Layer, pivot, Rig, type LayerStyle } from '../Layer';
import { useBlink, useHop, useOscillator, usePhase, useTwitch, useWave } from '../anim';
import {
  Backpack,
  Blush,
  BrowsPart,
  Ear,
  EAR_PIVOT,
  EXPRESSIONS,
  EYE_Y,
  EyesPart,
  Foot,
  FOX,
  FoxDefs,
  HeadBase,
  MouthPart,
  Nose,
  Paw,
  Strap,
  Tail,
  type Expression,
  type FoxGradient,
} from './FoxArt';

/* Gradients each sheet paints with (keeps the DOM / native tree small). */
const G_TAIL: FoxGradient[] = ['tail'];
const G_LIMB: FoxGradient[] = ['limb', 'paw'];
const G_EARS: FoxGradient[] = ['ear', 'earIn'];
const G_HEAD: FoxGradient[] = ['fur', 'cream'];
const G_TRUNK: FoxGradient[] = ['pack', 'body', 'cream'];
const G_STAND: FoxGradient[] = ['pack', 'body', 'cream', 'limb', 'paw'];
const G_BOOK: FoxGradient[] = ['book', 'paw'];

export type FoxPose =
  | 'wave'
  | 'walk'
  | 'jump'
  | 'cheer'
  | 'meditate'
  | 'breathe'
  | 'read'
  | 'sleep'
  | 'bust'
  | 'head';

export type FoxProps = {
  pose?: FoxPose;
  /** Rendered height in points. */
  size?: number;
  expression?: Expression;
  motion?: MotionLevel;
  /** Tap the fox for a happy hop (default true). */
  interactive?: boolean;
  onPress?: () => void;
  /** External breathing drive 0..1 (guided breathing). */
  breath?: SharedValue<number>;
  /** Hide the backpack (e.g. calm poses). */
  backpack?: boolean;
  /** Bust/head only: show a waving paw. */
  wavePaw?: boolean;
  /** Guided breathing phase; 'out' rounds the mouth as if blowing a bubble. */
  breathPhase?: 'in' | 'hold' | 'out';
  /** Walk pose only: false keeps the feet still (default true). */
  stepping?: boolean;
  /** Purely decorative: hidden from screen readers. */
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

type Anim = {
  level: MotionLevel;
  breath: SharedValue<number>;
  blink: SharedValue<number>;
  tilt: SharedValue<number>;
  earL: SharedValue<number>;
  earR: SharedValue<number>;
  tail: SharedValue<number>;
  wave: SharedValue<number>;
  hop: SharedValue<number>;
  phase: SharedValue<number>;
  poke: SharedValue<number>;
  /** Cheer arms (own rhythm, not the tail's). */
  arms: SharedValue<number>;
  /** Open-mouth amount 0..1 (read-aloud flap or breathing out). */
  talk: SharedValue<number>;
  /** Points per viewBox unit, so motion amplitudes scale with render size. */
  k: number;
  /** An external breathing driver is attached. */
  guided: boolean;
  /** Mouth drawn on its own layers (talking / breathing out). */
  mouthSplit: boolean;
};

const VB: Record<FoxPose, [number, number]> = {
  wave: [240, 240],
  walk: [240, 240],
  jump: [240, 240],
  cheer: [252, 228],
  meditate: [240, 214],
  breathe: [240, 222],
  read: [220, 218],
  sleep: [270, 170],
  bust: [200, 200],
  head: [180, 180],
};

const DEFAULT_EXPRESSION: Record<FoxPose, Expression> = {
  wave: 'happy',
  walk: 'happy',
  jump: 'joy',
  cheer: 'joy',
  meditate: 'calm',
  breathe: 'calm',
  read: 'focus',
  sleep: 'sleepy',
  bust: 'happy',
  head: 'happy',
};

function useFoxAnim(
  pose: FoxPose,
  level: MotionLevel,
  size: number,
  { external, stepping, wavePaw, override }: { external?: SharedValue<number>; stepping: boolean; wavePaw: boolean; override: boolean },
): Anim {
  const on = level !== 'off';
  const full = level === 'full';
  // Ambient loops only run on the focused screen (and respect background motion);
  // taps and hops follow the motion level. An explicit `motion` prop wins.
  const focused = useIsFocused();
  const ambient = useAmbientMotion();
  const amb = override ? on && focused : ambient;
  const celebration = useCelebration();
  const calmPose = pose === 'meditate' || pose === 'breathe' || pose === 'sleep';
  const breathDur = pose === 'sleep' ? 2600 : calmPose ? 2200 : 1700;
  const internalBreath = useOscillator(amb && !external, breathDur);
  const blink = useBlink(focused, on ? 'normal' : 'slow');
  const tilt = useOscillator(amb, full ? 2600 : 3600, { rest: 0.5 });
  const earL = useTwitch(amb && full, 3200, 7600);
  const earR = useTwitch(amb, 2600, 6400);
  const tail = useOscillator(amb, pose === 'sleep' ? 1800 : calmPose ? 1400 : full ? 1100 : 1500, { rest: 0.5 });
  const waves = pose === 'wave' || pose === 'walk' || pose === 'jump' || (pose === 'bust' && wavePaw);
  const wave = useWave(amb && waves, !full);
  const celebrates = pose === 'jump' || pose === 'cheer';
  const hop = useHop(
    on && celebrates && celebration !== 'minimal',
    pose === 'jump' ? 1000 : 1200,
    pose === 'jump' ? 500 : 900,
    celebration === 'full' ? 3 : 1,
  );
  const phase = usePhase(
    amb && ((pose === 'walk' && stepping) || pose === 'read' || pose === 'sleep'),
    pose === 'walk' ? (full ? 900 : 1500) : pose === 'read' ? 4200 : 3600,
  );
  const arms = useOscillator(amb && pose === 'cheer', 900, { rest: 0.5 });
  const poke = useSharedValue(0);
  const talk = useSharedValue(0);
  return {
    level,
    breath: external ?? internalBreath,
    blink,
    tilt,
    earL,
    earR,
    tail,
    wave,
    hop,
    phase,
    poke,
    arms,
    talk,
    k: size / VB[pose][1],
    guided: !!external,
    mouthSplit: false,
  };
}

/* ------------------------------------------------------------------------ */
/* Head rig                                                                  */
/* ------------------------------------------------------------------------ */

type HeadPlacement = { x: number; y: number; s: number; rot?: number };

function HeadRig({
  vb,
  head,
  expression,
  a,
  tiltDeg = 3,
  bob = 1.4,
}: {
  vb: [number, number];
  head: HeadPlacement;
  expression: Expression;
  a: Anim;
  tiltDeg?: number;
  bob?: number;
}) {
  // While talking or breathing out the mouth sits on its own layers so it can open into an 'o'.
  const mouthSplit = a.mouthSplit;
  const p = useUid('fh');
  const [W, H] = vb;
  const { x, y, s, rot = 0 } = head;
  const t = `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
  const ex = EXPRESSIONS[expression];
  const toPose = (lx: number, ly: number) => {
    const r = (rot * Math.PI) / 180;
    return {
      x: x + (lx * Math.cos(r) - ly * Math.sin(r)) * s,
      y: y + (lx * Math.sin(r) + ly * Math.cos(r)) * s,
    };
  };
  const neck = toPose(0, 50);
  const eL = toPose(EAR_PIVOT.left.x, EAR_PIVOT.left.y);
  const eR = toPose(EAR_PIVOT.right.x, EAR_PIVOT.right.y);
  const eye = toPose(0, EYE_Y + 1);
  const jaw = toPose(0, 19);

  // A quick blink masks the swap when the expression changes.
  const swap = useSharedValue(1);
  const lastExpr = useRef(expression);
  useEffect(() => {
    if (lastExpr.current === expression) return;
    lastExpr.current = expression;
    swap.value = withSequence(withTiming(0, { duration: 60 }), withTiming(1, { duration: 110 }));
  }, [expression, swap]);

  const headStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -a.breath.value * bob * a.k },
      { rotate: `${(a.tilt.value - 0.5) * 2 * tiltDeg + a.poke.value * 6}deg` },
    ],
  }));
  const earLStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-a.earL.value * 13 - a.poke.value * 10}deg` }],
  }));
  const earRStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${a.earR.value * 13 + a.poke.value * 10}deg` }],
  }));
  const blinks = ex.eyes === 'open' || ex.eyes === 'down' || ex.eyes === 'side';
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: (blinks ? 0.08 + 0.92 * a.blink.value : 1) * (0.08 + 0.92 * swap.value) }],
  }));
  const restMouth = useAnimatedStyle(() => ({ opacity: 1 - a.talk.value }));
  const openMouth = useAnimatedStyle(() => ({ opacity: a.talk.value, transform: [{ scaleY: 0.35 + 0.65 * a.talk.value }] }));

  return (
    <Rig style={[pivot(neck.x, neck.y, W, H), headStyle]}>
      <Layer vb={`0 0 ${W} ${H}`} style={[pivot(eL.x, eL.y, W, H), earLStyle]}>
        <FoxDefs p={`${p}a`} ids={G_EARS} />
        <G transform={t}>
          <Ear p={`${p}a`} side="left" />
        </G>
      </Layer>
      <Layer vb={`0 0 ${W} ${H}`} style={[pivot(eR.x, eR.y, W, H), earRStyle]}>
        <FoxDefs p={`${p}b`} ids={G_EARS} />
        <G transform={t}>
          <Ear p={`${p}b`} side="right" />
        </G>
      </Layer>
      <Layer vb={`0 0 ${W} ${H}`}>
        <FoxDefs p={`${p}c`} ids={G_HEAD} />
        <G transform={t}>
          <HeadBase p={`${p}c`} />
          <Blush opacity={ex.blush} />
          <BrowsPart kind={ex.brows} />
          <Nose />
          {!mouthSplit && <MouthPart kind={ex.mouth} />}
        </G>
      </Layer>
      {mouthSplit && (
        <Layer vb={`0 0 ${W} ${H}`} style={restMouth}>
          <G transform={t}>
            <MouthPart kind={ex.mouth} />
          </G>
        </Layer>
      )}
      {mouthSplit && (
        <Layer vb={`0 0 ${W} ${H}`} style={[pivot(jaw.x, jaw.y, W, H), openMouth]}>
          <G transform={t}>
            <MouthPart kind="o" />
          </G>
        </Layer>
      )}
      <Layer vb={`0 0 ${W} ${H}`} style={[pivot(eye.x, eye.y, W, H), eyeStyle]}>
        <G transform={t}>
          <EyesPart kind={ex.eyes} />
        </G>
      </Layer>
    </Rig>
  );
}

/* ------------------------------------------------------------------------ */
/* Body sheets                                                               */
/* ------------------------------------------------------------------------ */

function Sheet({ vb, style, ids, children }: { vb: [number, number]; style?: LayerStyle; ids?: FoxGradient[]; children: (p: string) => ReactNode }) {
  const p = useUid('fb');
  return (
    <Layer vb={`0 0 ${vb[0]} ${vb[1]}`} style={style as never}>
      <FoxDefs p={p} ids={ids} />
      {children(p)}
    </Layer>
  );
}

const TORSO =
  'M 95 126 C 86 145 83 170 86 192 C 88 206 102 213 120 213 C 138 213 152 206 154 192 C 157 170 154 145 145 126 Z';
/** Cream belly running up to the chin (no separate bib). */
const BELLY =
  'M 108 128 C 114 133 126 133 132 128 C 142 142 145 160 143 178 C 141 195 132 205 120 205 C 108 205 99 195 97 178 C 95 160 98 142 108 128 Z';

function Torso({ p, packStraps = true }: { p: string; packStraps?: boolean }) {
  return (
    <G>
      <Path d={TORSO} fill={`url(#${p}body)`} />
      <Path d={BELLY} fill={`url(#${p}cream)`} />
      {packStraps && (
        <G>
          <Strap d="M 96 124 C 99 136 100 150 98 168 C 97 176 94 182 90 186 L 86 180 C 91 172 93 160 92 146 C 91 136 90 130 89 126 Z" />
          <Strap d="M 144 124 C 141 136 140 150 142 168 C 143 176 146 182 150 186 L 154 180 C 149 172 147 160 148 146 C 149 136 150 130 151 126 Z" />
        </G>
      )}
    </G>
  );
}

/* ------------------------------------------------------------------------ */
/* Poses                                                                     */
/* ------------------------------------------------------------------------ */

function WavePose({ a, expression, backpack }: { a: Anim; expression: Expression; backpack: boolean }) {
  const vb = VB.wave;
  const [W, H] = vb;
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(a.tail.value - 0.5) * 2 * 5}deg` }],
  }));
  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${a.wave.value * 16 - 4}deg` }],
  }));
  const holdStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(a.breath.value - 0.5) * 3}deg` }],
  }));
  return (
    <>
      <Sheet vb={vb} ids={G_TAIL} style={[pivot(100, 196, W, H), tailStyle]}>
        {(p) => <Tail p={p} transform="translate(100 196) rotate(-6)" />}
      </Sheet>
      <Sheet vb={vb} ids={G_STAND}>
        {(p) => (
          <G>
            {backpack && <Backpack p={p} x={64} y={130} w={38} h={64} />}
            <Path d="M 97 194 L 97 212 C 97 219 115 219 115 212 L 115 196 Z" fill={`url(#${p}limb)`} />
            <Path d="M 125 196 L 125 212 C 125 219 143 219 143 212 L 143 194 Z" fill={`url(#${p}limb)`} />
            <Foot p={p} cx={105} cy={218} w={27} h={13} />
            <Foot p={p} cx={135} cy={218} w={27} h={13} />
            <Torso p={p} packStraps={backpack} />
          </G>
        )}
      </Sheet>
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(98, 134, W, H), holdStyle]}>
        {(p) => (
          <G>
            <Path
              d="M 101 130 C 88 135 82 150 86 163 C 89 172 99 174 107 170 C 113 167 113 160 108 157 C 102 157 98 152 99 145 Z"
              fill={`url(#${p}limb)`}
            />
            <Paw p={p} cx={110} cy={163} rx={7.5} ry={8.5} rot={-20} />
          </G>
        )}
      </Sheet>
      <HeadRig vb={vb} head={{ x: 120, y: 84, s: 0.83 }} expression={expression} a={a} />
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(146, 140, W, H), armStyle]}>
        {(p) => (
          <G>
            <Path
              d="M 139 132 C 153 116 170 97 183 80 C 189 72 203 74 204 84 C 203 93 196 101 188 109 C 176 123 163 138 151 150 Z"
              fill={`url(#${p}limb)`}
            />
            <Paw p={p} cx={195} cy={78} rx={11} ry={12.5} rot={32} beans />
          </G>
        )}
      </Sheet>
    </>
  );
}

function BustPose({ a, expression, backpack, wavePaw }: { a: Anim; expression: Expression; backpack: boolean; wavePaw: boolean }) {
  const vb = VB.bust;
  const [W, H] = vb;
  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${a.wave.value * 14}deg` }],
  }));
  return (
    <>
      <Sheet vb={vb} ids={G_TRUNK}>
        {(p) => (
          <G>
            {backpack && (
              <G>
                <Path d="M 66 150 C 44 150 32 164 32 184 L 32 200 L 70 200 Z" fill={`url(#${p}pack)`} />
                <Path d="M 134 150 C 156 150 168 164 168 184 L 168 200 L 130 200 Z" fill={`url(#${p}pack)`} />
              </G>
            )}
            <Path d="M 56 200 C 56 172 72 146 100 144 C 128 146 144 172 144 200 Z" fill={`url(#${p}body)`} />
            <Path d="M 88 146 C 94 151 106 151 112 146 C 120 158 123 176 123 200 L 77 200 C 77 176 80 158 88 146 Z" fill={`url(#${p}cream)`} />
            {backpack && (
              <G>
                <Strap d="M 70 150 C 73 166 74 184 74 200 L 82 200 C 82 184 81 166 78 150 Z" />
                <Strap d="M 122 150 C 119 166 118 184 118 200 L 126 200 C 126 184 127 166 130 150 Z" />
              </G>
            )}
          </G>
        )}
      </Sheet>
      <HeadRig vb={vb} head={{ x: 100, y: 96, s: 0.9 }} expression={expression} a={a} tiltDeg={4} bob={1.1} />
      {wavePaw && (
        <Sheet vb={vb} ids={G_LIMB} style={[pivot(142, 170, W, H), armStyle]}>
          {(p) => (
            <G>
              {/* Rooted at the shoulder, not floating beside the chest. */}
              <Path d="M 132 160 C 146 150 158 138 166 124 C 170 116 182 118 182 128 C 180 140 170 156 152 176 Z" fill={`url(#${p}limb)`} />
              <Paw p={p} cx={174} cy={120} rx={10} ry={11} rot={24} beans />
            </G>
          )}
        </Sheet>
      )}
    </>
  );
}

/** Shared helpers for limb sheets that swing around a pivot. */
function useSwing(v: SharedValue<number>, amp: number, offset = 0, center = 0.5) {
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${(v.value - center) * 2 * amp + offset}deg` }] }));
}

function WalkPose({ a, expression, backpack }: { a: Anim; expression: Expression; backpack: boolean }) {
  const vb = VB.walk;
  const [W, H] = vb;
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(a.phase.value * Math.PI * 2) * 6 - 4}deg` }],
  }));
  const legL = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(a.phase.value * Math.PI * 2) * 20}deg` }] }));
  const legR = useAnimatedStyle(() => ({ transform: [{ rotate: `${-Math.sin(a.phase.value * Math.PI * 2) * 20}deg` }] }));
  const bodyBob = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.abs(Math.sin(a.phase.value * Math.PI * 2)) * 4 * a.k }],
  }));
  const armStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${a.wave.value * 14 - 4}deg` }] }));
  const holdStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-Math.sin(a.phase.value * Math.PI * 2) * 8}deg` }] }));
  return (
    <>
      {/* Both legs sit behind the torso so neither covers the cream belly. */}
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(116, 206, W, H), legR]}>
        {(p) => (
          <G>
            <Path d="M 124 196 L 126 214 C 127 220 143 219 142 212 L 140 194 Z" fill={`url(#${p}limb)`} />
            <Foot p={p} cx={136} cy={218} w={27} h={13} rot={-6} />
          </G>
        )}
      </Sheet>
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(104, 204, W, H), legL]}>
        {(p) => (
          <G>
            <Path d="M 98 202 C 98 196 114 196 114 202 L 112 213 C 111 220 95 219 96 212 Z" fill={`url(#${p}limb)`} />
            <Foot p={p} cx={102} cy={218} w={27} h={13} rot={6} />
          </G>
        )}
      </Sheet>
      <Rig style={bodyBob}>
        <Sheet vb={vb} ids={G_TAIL} style={[pivot(100, 196, W, H), tailStyle]}>
          {(p) => <Tail p={p} transform="translate(100 196) rotate(-12)" />}
        </Sheet>
        <Sheet vb={vb} ids={G_TRUNK}>
          {(p) => (
            <G>
              {backpack && <Backpack p={p} x={62} y={128} w={40} h={64} />}
              <Torso p={p} packStraps={backpack} />
            </G>
          )}
        </Sheet>
        <Sheet vb={vb} ids={G_LIMB} style={[pivot(98, 134, W, H), holdStyle]}>
          {(p) => (
            <G>
              <Path d="M 101 130 C 88 135 82 150 86 163 C 89 172 99 174 107 170 C 113 167 113 160 108 157 C 102 157 98 152 99 145 Z" fill={`url(#${p}limb)`} />
              <Paw p={p} cx={110} cy={163} rx={7.5} ry={8.5} rot={-20} />
            </G>
          )}
        </Sheet>
        <HeadRig vb={vb} head={{ x: 120, y: 84, s: 0.83, rot: 3 }} expression={expression} a={a} />
        <Sheet vb={vb} ids={G_LIMB} style={[pivot(146, 140, W, H), armStyle]}>
          {(p) => (
            <G>
              <Path d="M 139 132 C 153 116 170 97 183 80 C 189 72 203 74 204 84 C 203 93 196 101 188 109 C 176 123 163 138 151 150 Z" fill={`url(#${p}limb)`} />
              <Paw p={p} cx={195} cy={78} rx={11} ry={12.5} rot={32} beans />
            </G>
          )}
        </Sheet>
      </Rig>
    </>
  );
}

function JumpPose({ a, expression, backpack }: { a: Anim; expression: Expression; backpack: boolean }) {
  const vb = VB.jump;
  const [W, H] = vb;
  const tailStyle = useSwing(a.tail, 8);
  const armUp = useAnimatedStyle(() => ({ transform: [{ rotate: `${-a.wave.value * 14 + 4}deg` }] }));
  const kick = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.max(0, a.hop.value) * 12}deg` }] }));
  const knee = useAnimatedStyle(() => ({ transform: [{ rotate: `${-Math.max(0, a.hop.value) * 18}deg` }] }));
  return (
    <>
      <Sheet vb={vb} ids={G_TAIL} style={[pivot(140, 196, W, H), tailStyle]}>
        {(p) => <Tail p={p} flip transform="translate(140 196) rotate(8)" />}
      </Sheet>
      <Sheet vb={vb} ids={G_STAND}>
        {(p) => (
          <G>
            {backpack && <Backpack p={p} x={60} y={128} w={40} h={62} />}
            <Path d="M 126 196 L 128 214 C 129 220 145 219 144 212 L 142 194 Z" fill={`url(#${p}limb)`} />
            <Foot p={p} cx={138} cy={219} w={27} h={13} rot={-4} />
            <Torso p={p} packStraps={backpack} />
            <Path d="M 142 132 C 154 142 158 158 154 172 C 151 180 143 182 139 176 C 136 170 142 164 143 156 C 144 148 140 142 137 138 Z" fill={`url(#${p}limb)`} />
            <Paw p={p} cx={146} cy={176} rx={7.5} ry={8.5} rot={10} />
          </G>
        )}
      </Sheet>
      {/* Kick leg: thigh swings from the hip, shin bends at the knee. */}
      <Rig style={[pivot(108, 196, W, H), kick]}>
        <Sheet vb={vb} ids={G_LIMB} style={[pivot(83, 181, W, H), knee]}>
          {(p) => (
            <G>
              <Path d="M 88 175 C 83 180 78 185 73 188 C 67 191 66 199 72 200 C 78 201 84 195 89 190 Z" fill={`url(#${p}limb)`} />
              <Foot p={p} cx={70} cy={194} w={28} h={16} rot={-50} />
            </G>
          )}
        </Sheet>
        <Sheet vb={vb} ids={['body']}>
          {(p) => (
            <Path
              d="M 112 188 C 104 186 94 182 86 176 C 80 176 77 182 80 186 C 90 194 102 200 112 202 C 119 202 120 189 112 188 Z"
              fill={`url(#${p}body)`}
              stroke={FOX.furShade}
              strokeOpacity={0.25}
              strokeWidth={1.2}
            />
          )}
        </Sheet>
      </Rig>
      <HeadRig vb={vb} head={{ x: 122, y: 84, s: 0.83, rot: 4 }} expression={expression} a={a} tiltDeg={4} />
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(98, 140, W, H), armUp]}>
        {(p) => (
          <G>
            <Path d="M 102 134 C 88 118 72 98 60 82 C 54 74 40 77 40 87 C 42 96 48 104 56 112 C 68 126 80 140 92 150 C 100 156 110 142 102 134 Z" fill={`url(#${p}limb)`} />
            <Paw p={p} cx={48} cy={80} rx={11} ry={12.5} rot={-32} beans />
          </G>
        )}
      </Sheet>
    </>
  );
}

const SEATED_BELLY =
  'M 108 128 C 114 133 126 133 132 128 C 143 142 147 156 145 173 C 144 190 134 200 120 200 C 106 200 96 190 95 173 C 93 156 97 142 108 128 Z';

function SeatedBody({ p, pack, legs = 'forward' }: { p: string; pack: boolean; legs?: 'forward' | 'crossed' }) {
  return (
    <G>
      {pack && (
        <G>
          <Path d="M 96 132 C 74 132 64 150 64 170 C 64 184 70 192 80 194 L 98 194 Z" fill={`url(#${p}pack)`} />
          <Path d="M 144 132 C 166 132 176 150 176 170 C 176 184 170 192 160 194 L 142 194 Z" fill={`url(#${p}pack)`} />
        </G>
      )}
      {/* Pear-shaped, well-padded seated torso (as on the boards). */}
      <Path
        d="M 94 124 C 80 142 72 166 74 190 C 76 204 98 208 120 208 C 142 208 164 204 166 190 C 168 166 160 142 146 124 Z"
        fill={`url(#${p}body)`}
      />
      <Path d={SEATED_BELLY} fill={`url(#${p}cream)`} />
      {legs === 'forward' ? (
        <G>
          <Path d="M 88 184 C 72 188 64 198 68 208 C 72 214 90 214 102 208 C 108 202 104 190 98 186 Z" fill={`url(#${p}limb)`} />
          <Path d="M 152 184 C 168 188 176 198 172 208 C 168 214 150 214 138 208 C 132 202 136 190 142 186 Z" fill={`url(#${p}limb)`} />
          <Foot p={p} cx={77} cy={208} w={32} h={18} rot={-8} />
          <Foot p={p} cx={163} cy={208} w={32} h={18} rot={8} />
        </G>
      ) : (
        <G>
          <Path d="M 60 192 C 50 180 64 166 94 168 L 146 168 C 176 166 190 180 180 192 C 172 206 144 212 120 212 C 96 212 68 206 60 192 Z" fill={`url(#${p}body)`} />
          <Path d="M 70 194 C 88 184 106 184 120 191 C 134 184 152 184 170 194" stroke={FOX.furShade} strokeOpacity={0.35} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Ellipse cx={66} cy={196} rx={10} ry={8} fill={`url(#${p}paw)`} />
          <Ellipse cx={174} cy={196} rx={10} ry={8} fill={`url(#${p}paw)`} />
        </G>
      )}
      {pack && (
        <G>
          <Strap d="M 96 126 C 99 136 100 148 99 160 L 92 160 C 93 148 92 136 89 128 Z" />
          <Strap d="M 144 126 C 141 136 140 148 141 160 L 148 160 C 147 148 148 136 151 128 Z" />
        </G>
      )}
    </G>
  );
}

function CheerPose({ a, expression, backpack }: { a: Anim; expression: Expression; backpack: boolean }) {
  const vb = VB.cheer;
  const [W, H] = vb;
  // The art is authored 240 wide; the wider sheet (+6 each side) keeps the raised paws unclipped.
  const shift = 'translate(6 0)';
  const tailStyle = useSwing(a.tail, 7);
  const armL = useAnimatedStyle(() => ({ transform: [{ rotate: `${(a.arms.value - 0.5) * 16}deg` }] }));
  const armR = useAnimatedStyle(() => ({ transform: [{ rotate: `${-(a.arms.value - 0.5) * 16}deg` }] }));
  return (
    <>
      <Sheet vb={vb} ids={G_TAIL} style={[pivot(100, 196, W, H), tailStyle]}>
        {(p) => (
          <G transform={shift}>
            <Tail p={p} transform="translate(94 198) rotate(-18) scale(0.9)" />
          </G>
        )}
      </Sheet>
      <Sheet vb={vb} ids={G_STAND}>
        {(p) => (
          <G transform={shift}>
            <SeatedBody p={p} pack={backpack} />
          </G>
        )}
      </Sheet>
      {/* Arms up and out in a wide V: paws well clear of the ears. */}
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(104, 146, W, H), armL]}>
        {(p) => (
          <G transform={shift}>
            <Path d="M 102 138 C 86 124 64 104 44 84 C 38 76 24 80 26 90 C 30 98 38 106 48 114 C 64 128 80 142 92 154 Z" fill={`url(#${p}limb)`} />
            <Paw p={p} cx={34} cy={80} rx={11} ry={12.5} rot={-45} beans />
          </G>
        )}
      </Sheet>
      <Sheet vb={vb} ids={G_LIMB} style={[pivot(148, 146, W, H), armR]}>
        {(p) => (
          <G transform={shift}>
            <Path d="M 138 138 C 154 124 176 104 196 84 C 202 76 216 80 214 90 C 210 98 202 106 192 114 C 176 128 160 142 148 154 Z" fill={`url(#${p}limb)`} />
            <Paw p={p} cx={206} cy={80} rx={11} ry={12.5} rot={45} beans />
          </G>
        )}
      </Sheet>
      <HeadRig vb={vb} head={{ x: 126, y: 86, s: 0.83 }} expression={expression} a={a} tiltDeg={4} />
    </>
  );
}

/** Guided breathing drives a visible chest rise; ambient breathing stays subtle. */
function useChest(a: Anim) {
  const sx = a.guided ? 0.05 : 0.025;
  const sy = a.guided ? 0.08 : 0.035;
  return useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + a.breath.value * sx }, { scaleY: 1 + a.breath.value * sy }],
  }));
}

function MeditatePose({ a, expression }: { a: Anim; expression: Expression }) {
  const vb = VB.meditate;
  const [W, H] = vb;
  const chest = useChest(a);
  return (
    <>
      <Layer vb={`0 0 ${W} ${H}`}>
        <Ellipse cx={120} cy={203} rx={92} ry={11} fill="#2E9C7A" />
        <Ellipse cx={120} cy={201} rx={84} ry={8} fill="#3BAE89" />
      </Layer>
      <Rig style={[pivot(120, 206, W, H), chest]}>
        <Sheet vb={vb} ids={G_STAND}>
          {(p) => (
            <G>
              <SeatedBody p={p} pack={false} legs="crossed" />
              <Path d="M 99 136 C 86 146 84 166 94 180 C 100 188 110 190 116 186 L 112 176 C 104 174 100 164 104 150 Z" fill={`url(#${p}limb)`} />
              <Path d="M 141 136 C 154 146 156 166 146 180 C 140 188 130 190 124 186 L 128 176 C 136 174 140 164 136 150 Z" fill={`url(#${p}limb)`} />
              <Path d="M 120 168 C 112 170 108 180 110 190 C 112 198 120 200 121 192 Z" fill={`url(#${p}paw)`} />
              <Path d="M 120 168 C 128 170 132 180 130 190 C 128 198 120 200 119 192 Z" fill={`url(#${p}paw)`} />
            </G>
          )}
        </Sheet>
      </Rig>
      <HeadRig vb={vb} head={{ x: 120, y: 88, s: 0.83 }} expression={expression} a={a} tiltDeg={1.5} bob={a.guided ? 5 : 2.4} />
    </>
  );
}

function BreathePose({ a, expression, backpack }: { a: Anim; expression: Expression; backpack: boolean }) {
  const vb = VB.breathe;
  const [W, H] = vb;
  const tailStyle = useSwing(a.tail, 4);
  const chest = useChest(a);
  return (
    <>
      <Sheet vb={vb} ids={G_TAIL} style={[pivot(92, 200, W, H), tailStyle]}>
        {(p) => <Tail p={p} transform="translate(96 200) rotate(-22) scale(0.72)" />}
      </Sheet>
      <Rig style={[pivot(120, 206, W, H), chest]}>
        <Sheet vb={vb} ids={G_STAND}>
          {(p) => (
            <G>
              <SeatedBody p={p} pack={backpack} />
              <Path d="M 99 136 C 86 146 86 166 96 176 C 102 180 108 180 110 176 L 106 166 C 102 162 100 154 104 146 Z" fill={`url(#${p}limb)`} />
              <Path d="M 141 136 C 154 146 154 166 144 176 C 138 180 132 180 130 176 L 134 166 C 138 162 140 154 136 146 Z" fill={`url(#${p}limb)`} />
              <Paw p={p} cx={108} cy={174} rx={7} ry={8} rot={10} />
              <Paw p={p} cx={132} cy={174} rx={7} ry={8} rot={-10} />
            </G>
          )}
        </Sheet>
      </Rig>
      <HeadRig vb={vb} head={{ x: 120, y: 86, s: 0.83 }} expression={expression} a={a} tiltDeg={1.5} bob={a.guided ? 5 : 2.6} />
    </>
  );
}

function ReadPose({ a, expression }: { a: Anim; expression: Expression }) {
  const vb = VB.read;
  const [W, H] = vb;
  const tailStyle = useSwing(a.tail, 5);
  const page = useAnimatedStyle(() => {
    const t = a.phase.value; // flip during the last 18% of each cycle
    const k = t > 0.82 ? (t - 0.82) / 0.18 : 0;
    return { opacity: k > 0 && k < 1 ? 1 : 0, transform: [{ scaleX: 1 - 2 * k }] };
  });
  return (
    <>
      <Sheet vb={vb} ids={G_TAIL} style={[pivot(84, 190, W, H), tailStyle]}>
        {(p) => <Tail p={p} transform="translate(84 194) rotate(-30) scale(0.72)" />}
      </Sheet>
      <Sheet vb={vb} ids={G_STAND}>
        {(p) => (
          <G transform="translate(-10 -4)">
            <SeatedBody p={p} pack={false} />
          </G>
        )}
      </Sheet>
      <HeadRig vb={vb} head={{ x: 110, y: 84, s: 0.8 }} expression={expression} a={a} tiltDeg={2} />
      <Sheet vb={vb} ids={G_BOOK}>
        {(p) => (
          <G>
            <Path d="M 110 150 L 62 142 C 58 142 56 144 56 148 L 58 190 C 58 194 60 196 64 196 L 110 202 Z" fill={`url(#${p}book)`} />
            <Path d="M 110 150 L 158 142 C 162 142 164 144 164 148 L 162 190 C 162 194 160 196 156 196 L 110 202 Z" fill={`url(#${p}book)`} />
            <Path d="M 110 150 L 66 143 L 68 188 L 110 195 Z" fill={FOX.bookPage} opacity={0.18} />
            <Path d="M 110 150 L 110 202" stroke="#1C5FC8" strokeWidth={2.4} />
            <Path d="M 76 156 L 102 160 M 76 164 L 102 168 M 118 160 L 146 156 M 118 168 L 146 164" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={2.2} strokeLinecap="round" />
            <Paw p={p} cx={60} cy={172} rx={8} ry={9} rot={-10} />
            <Paw p={p} cx={160} cy={172} rx={8} ry={9} rot={10} />
          </G>
        )}
      </Sheet>
      <Layer vb={`0 0 ${W} ${H}`} style={[pivot(110, 170, W, H), page]}>
        <Path d="M 110 150 L 150 144 L 148 190 L 110 196 Z" fill="#6FA8F7" />
      </Layer>
    </>
  );
}

function SleepPose({ a, expression, backpack }: { a: Anim; expression: Expression; backpack: boolean }) {
  const vb = VB.sleep;
  const [W, H] = vb;
  const tailStyle = useSwing(a.tail, 3);
  const body = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + a.breath.value * 0.04 }] }));
  const k = a.k;
  const z1 = useAnimatedStyle(() => {
    const t = a.phase.value;
    return { opacity: Math.sin(t * Math.PI) * 0.9, transform: [{ translateX: t * 14 * k }, { translateY: -t * 26 * k }, { scale: 0.7 + t * 0.4 }] };
  });
  const z2 = useAnimatedStyle(() => {
    const t = (a.phase.value + 0.5) % 1;
    return { opacity: Math.sin(t * Math.PI) * 0.75, transform: [{ translateX: t * 12 * k }, { translateY: -t * 22 * k }, { scale: 0.55 + t * 0.35 }] };
  });
  return (
    <>
      {/* Tail curls up past the rump, tip clear of the pack (as on the board). */}
      <Sheet vb={vb} ids={G_TAIL} style={[pivot(220, 150, W, H), tailStyle]}>
        {(p) => <Tail p={p} flip transform="translate(220 150) rotate(-4) scale(0.66)" />}
      </Sheet>
      <Rig style={[pivot(140, 164, W, H), body]}>
        <Sheet vb={vb} ids={['body', 'pack']}>
          {(p) => (
            <G>
              <Path d="M 48 150 C 38 124 62 102 108 98 L 170 98 C 214 100 236 118 232 142 C 230 156 214 162 196 162 L 70 162 C 58 162 50 158 48 150 Z" fill={`url(#${p}body)`} />
              <Path d="M 52 140 C 44 128 48 118 58 116 C 56 126 60 136 70 144 Z" fill={FOX.cream} opacity={0.9} />
              {backpack && (
                <G>
                  {/* One rounded pack resting on the back. */}
                  <Path d="M 158 94 C 170 88 194 88 202 96 C 208 104 208 120 202 127 C 196 130 164 130 156 127 C 150 118 150 102 158 94 Z" fill={`url(#${p}pack)`} />
                  <Path d="M 158 112 L 204 112 C 206 118 205 124 202 127 C 196 130 164 130 156 127 C 154 122 154 116 158 112 Z" fill={FOX.packLight} opacity={0.6} />
                  <Path d="M 162 98 C 170 93 186 92 196 96" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" fill="none" />
                </G>
              )}
            </G>
          )}
        </Sheet>
      </Rig>
      <HeadRig vb={vb} head={{ x: 128, y: 112, s: 0.74, rot: 16 }} expression={expression} a={a} tiltDeg={1} bob={1.6} />
      <Sheet vb={vb} ids={G_LIMB}>
        {(p) => (
          <G>
            <Path d="M 96 150 C 106 142 170 142 178 150 C 182 160 168 166 136 166 C 110 166 90 162 96 150 Z" fill={`url(#${p}limb)`} />
            <Paw p={p} cx={116} cy={157} rx={11} ry={8} rot={-8} />
            <Paw p={p} cx={156} cy={158} rx={11} ry={8} rot={8} />
          </G>
        )}
      </Sheet>
      <Layer vb={`0 0 ${W} ${H}`} style={z1}>
        <Path d="M 196 40 L 208 40 L 196 52 L 208 52" stroke="#7F8AC4" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Layer>
      <Layer vb={`0 0 ${W} ${H}`} style={z2}>
        <Path d="M 214 20 L 223 20 L 214 29 L 223 29" stroke="#A7B0D8" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Layer>
    </>
  );
}

function HeadPose({ a, expression }: { a: Anim; expression: Expression }) {
  return <HeadRig vb={VB.head} head={{ x: 90, y: 100, s: 0.78 }} expression={expression} a={a} tiltDeg={4} bob={0.8} />;
}

/* ------------------------------------------------------------------------ */
/* Public component                                                          */
/* ------------------------------------------------------------------------ */

const hiddenFromA11y = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
  'aria-hidden': true,
} as const;

export function Fox({
  pose = 'wave',
  size = 220,
  expression,
  motion,
  interactive = true,
  onPress,
  breath,
  backpack = true,
  wavePaw = false,
  breathPhase,
  stepping = true,
  decorative = false,
  style,
  accessibilityLabel = `${GUIDE.name} the fox`,
  accessibilityHint,
}: FoxProps) {
  const level = useMotionLevel(motion);
  const anim = useFoxAnim(pose, level, size, { external: breath, stepping, wavePaw, override: !!motion });
  const [W, H] = VB[pose];
  const width = (size * W) / H;
  const [tapExpr, setTapExpr] = useState<Expression | null>(null);
  const ex = tapExpr ?? expression ?? DEFAULT_EXPRESSION[pose];
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  // Mouth: flaps while read-aloud speaks, rounds into an 'o' on a guided out-breath.
  const speaking = useSpeaking((st) => st.speaking);
  const flap = speaking && level !== 'off' && !decorative && pose !== 'sleep';
  const exhale = breathPhase === 'out';
  const mouthLive = flap || breathPhase !== undefined;
  const [mouthLinger, setMouthLinger] = useState(false);
  if (mouthLive && !mouthLinger) setMouthLinger(true);
  useEffect(() => {
    if (mouthLive) return;
    const t = setTimeout(() => setMouthLinger(false), 200);
    return () => clearTimeout(t);
  }, [mouthLive]);
  const talk = anim.talk;
  useEffect(() => {
    if (exhale) {
      talk.set(withTiming(1, { duration: 120 }));
      return;
    }
    if (flap) {
      talk.set(
        withRepeat(
          withSequence(
            withTiming(1, { duration: 90 }),
            withTiming(0.3, { duration: 110 }),
            withTiming(0.8, { duration: 80 }),
            withTiming(0.1, { duration: 120 }),
          ),
          -1,
        ),
      );
      return () => cancelAnimation(talk);
    }
    talk.set(withTiming(0, { duration: 120 }));
  }, [exhale, flap, talk]);
  const a: Anim = { ...anim, mouthSplit: mouthLive || mouthLinger };

  // Soften pose swaps after the first render (not on screen entry).
  const [prevPose, setPrevPose] = useState(pose);
  const [poseSwapped, setPoseSwapped] = useState(false);
  if (prevPose !== pose) {
    setPrevPose(pose);
    setPoseSwapped(true);
  }
  const swapAnim = poseSwapped && level !== 'off';

  const celebrates = pose === 'jump' || pose === 'cheer';
  const hopLift = pose === 'jump' ? 0.09 : 0.05;
  const rootStyle = useAnimatedStyle(() => {
    const b = a.breath.value;
    const hop = a.hop.value;
    const poke = a.poke.value;
    // Only upward travel lifts the fox; crouches squash in place so the feet stay on the ground line.
    const hopY = celebrates ? -Math.max(0, hop) * size * hopLift : 0;
    const lift = Math.max(0, poke);
    const sq = Math.min(0, poke, celebrates ? hop : 0);
    return {
      transform: [
        { translateY: hopY - lift * size * 0.06 },
        { scaleX: 1 - sq * 0.08 },
        { scaleY: 1 + b * 0.012 + sq * 0.12 },
      ],
    };
  });

  const poke = anim.poke;
  const handlePress = useCallback(() => {
    onPress?.();
    if (!interactive) return;
    tapHaptic();
    if (level !== 'off') {
      poke.set(
        withSequence(
          withTiming(-0.25, { duration: 80 }),
          withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }),
        ),
      );
    }
    const closedEyes = ex === 'calm' || ex === 'sleepy';
    if (!closedEyes) {
      setTapExpr('joy');
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null;
        setTapExpr(null);
      }, 900);
    }
  }, [poke, ex, interactive, level, onPress]);

  let body: ReactNode;
  switch (pose) {
    case 'walk':
      body = <WalkPose a={a} expression={ex} backpack={backpack} />;
      break;
    case 'jump':
      body = <JumpPose a={a} expression={ex} backpack={backpack} />;
      break;
    case 'cheer':
      body = <CheerPose a={a} expression={ex} backpack={backpack} />;
      break;
    case 'meditate':
      body = <MeditatePose a={a} expression={ex} />;
      break;
    case 'breathe':
      body = <BreathePose a={a} expression={ex} backpack={backpack} />;
      break;
    case 'read':
      body = <ReadPose a={a} expression={ex} />;
      break;
    case 'sleep':
      body = <SleepPose a={a} expression={ex} backpack={backpack} />;
      break;
    case 'bust':
      body = <BustPose a={a} expression={ex} backpack={backpack} wavePaw={wavePaw} />;
      break;
    case 'head':
      body = <HeadPose a={a} expression={ex} />;
      break;
    case 'wave':
    default:
      body = <WavePose a={a} expression={ex} backpack={backpack} />;
  }

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(a.hop.value, [-0.4, 0, 1], [0.12, 0.09, 0.04]),
    transform: [{ scaleX: interpolate(a.hop.value, [-0.4, 0, 1], [1.08, 1, 0.7]) }],
  }));
  const hasShadow = pose !== 'bust' && pose !== 'head' && pose !== 'meditate';

  const pressable = interactive || !!onPress;
  const a11y = decorative
    ? hiddenFromA11y
    : pressable
      ? { accessible: false as const }
      : { accessible: true as const, accessibilityRole: 'image' as const, accessibilityLabel };

  const content = (
    <View style={[{ width, height: size }, style]} {...a11y}>
      {hasShadow && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: width * 0.2, right: width * 0.2, bottom: -size * 0.01, height: size * 0.06 }, shadowStyle]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
            <Ellipse cx={50} cy={10} rx={50} ry={10} fill="#34518F" />
          </Svg>
        </Animated.View>
      )}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width, height: size }, pivot(W / 2, H, W, H), rootStyle]}>
        <Animated.View
          key={pose}
          pointerEvents="none"
          entering={swapAnim ? ZoomIn.springify().damping(14).stiffness(180) : undefined}
          exiting={swapAnim ? FadeOut.duration(120) : undefined}
          style={StyleSheet.absoluteFill}
        >
          {body}
        </Animated.View>
      </Animated.View>
    </View>
  );

  if (!pressable) return content;
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint ?? (onPress ? `${GUIDE.name} talks to you` : `${GUIDE.name} wiggles`)}
      {...(decorative ? hiddenFromA11y : null)}
    >
      {content}
    </Pressable>
  );
}

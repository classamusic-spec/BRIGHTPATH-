import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useOscillator, usePhase } from '@/components/characters/anim';
import { useMotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

import { Bush, CloudShape, House, Lighthouse, Mountain, RoundTree, SCENE, Tree, Tuft } from './elements';
import { Stage, StageLayer, StageNode } from './Stage';

/** Full-phone viewBox so the map fills the Home screen edge to edge. */
export const WORLD_VB = { w: 390, h: 844 };

/** Pin positions (viewBox units) for the Home map buttons. */
export const WORLD_PINS = {
  explore: { x: 282, y: 288 },
  quests: { x: 110, y: 428 },
  calm: { x: 274, y: 562 },
  myWorld: { x: 160, y: 712 },
};

const PATH_1 = 'M 188 252 C 206 292 252 322 230 366 C 208 406 126 418 64 452 C 38 466 16 472 -12 476';
const PATH_2 = 'M 252 584 C 284 622 308 672 324 714 C 332 738 336 792 340 844';
const RIVER = 'M -24 488 C 90 476 200 458 318 450 C 386 446 406 482 370 512 C 324 550 256 576 228 622 C 204 662 214 722 208 844';

function Clouds() {
  const level = useMotionLevel();
  const t = useOscillator(level !== 'off', 9000);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: (t.value - 0.5) * 20 }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ translateX: -(t.value - 0.5) * 16 }] }));
  return (
    <>
      <StageLayer style={a}>
        <CloudShape x={64} y={158} s={0.72} opacity={0.95} />
        <CloudShape x={214} y={206} s={0.4} opacity={0.8} />
      </StageLayer>
      <StageLayer style={b}>
        <CloudShape x={344} y={128} s={0.56} opacity={0.9} />
      </StageLayer>
    </>
  );
}

function Birds() {
  const level = useMotionLevel();
  const t = usePhase(level === 'full', 16000);
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(t.value * Math.PI),
    transform: [{ translateX: -60 + t.value * 380 }, { translateY: Math.sin(t.value * Math.PI * 4) * 6 }],
  }));
  return (
    <StageLayer style={style}>
      <G stroke="#5B6AC8" strokeWidth={2} strokeLinecap="round" fill="none">
        <Path d="M 40 196 Q 45 191 50 196 Q 55 191 60 196" />
        <Path d="M 62 208 Q 66 204 70 208 Q 74 204 78 208" />
      </G>
    </StageLayer>
  );
}

function Flag() {
  const level = useMotionLevel();
  const t = useOscillator(level === 'full', 700);
  const s = useAnimatedStyle(() => ({ transform: [{ scaleX: 0.84 + t.value * 0.16 }, { skewY: `${(t.value - 0.5) * 8}deg` }] }));
  return (
    <StageLayer style={s} pivotAt={[246, 164]}>
      <Path d="M 246 152 L 269 158 L 246 165 Z" fill="#F0504E" />
    </StageLayer>
  );
}

function RiverShimmer() {
  const level = useMotionLevel();
  const t = useOscillator(level !== 'off', 2600);
  const s = useAnimatedStyle(() => ({ opacity: 0.3 + t.value * 0.55, transform: [{ translateX: (t.value - 0.5) * 10 }] }));
  return (
    <StageLayer style={s}>
      <G stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round">
        <Path d="M 34 482 L 58 480" />
        <Path d="M 148 468 L 176 465" />
        <Path d="M 268 454 L 292 452" />
        <Path d="M 344 482 L 356 470" />
        <Path d="M 266 572 L 280 560" />
        <Path d="M 218 660 L 219 642" />
        <Path d="M 212 760 L 212 740" />
      </G>
    </StageLayer>
  );
}

function SwayGroup({ children, pivot, phase = 0 }: { children: ReactNode; pivot: [number, number]; phase?: number }) {
  const level = useMotionLevel();
  const t = useOscillator(level === 'full', 2600 + phase * 500, { delay: phase * 350, rest: 0.5 });
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${(t.value - 0.5) * 2.2}deg` }] }));
  return (
    <StageLayer style={s} pivotAt={pivot}>
      {children}
    </StageLayer>
  );
}

export function WorldMapArt() {
  const u = useUid('wm');
  const g = (n: string) => `url(#${u}${n})`;
  return (
    <>
      <StageLayer>
        <Defs>
          <LinearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D3EAFD" />
            <Stop offset="0.35" stopColor="#EDF7FE" />
            <Stop offset="1" stopColor="#EDF7FE" />
          </LinearGradient>
          <LinearGradient id={`${u}land`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C6EBA4" />
            <Stop offset="0.55" stopColor="#B3E194" />
            <Stop offset="1" stopColor="#A4DA88" />
          </LinearGradient>
          <LinearGradient id={`${u}river`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8DCDFB" />
            <Stop offset="1" stopColor="#5AA9F3" />
          </LinearGradient>
          <LinearGradient id={`${u}mtn`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#5392F4" />
            <Stop offset="1" stopColor="#2A5ED3" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={390} height={844} fill={g('sky')} />
        {/* mountains */}
        <Path d="M 96 332 L 150 262 L 186 290 L 236 236 L 290 276 L 336 232 L 390 262 L 390 340 L 96 340 Z" fill="#B7D0F6" />
        <Mountain x={196} y={322} w={120} h={76} color="#93B8F2" />
        <Mountain x={246} y={330} w={156} h={164} color={g('mtn')} snow />
        <Path d="M 246 166 L 246 150" stroke="#3A4A8C" strokeWidth={2.4} strokeLinecap="round" />
        <Mountain x={352} y={332} w={110} h={70} color="#8FB4F0" />
        {/* land */}
        <Path d="M 0 296 C 60 284 124 300 172 310 C 232 322 306 304 390 296 L 390 844 L 0 844 Z" fill={g('land')} />
        <Path d="M 0 360 C 70 346 142 366 198 374 C 262 384 332 366 390 358 L 390 844 L 0 844 Z" fill="#BDE69C" opacity={0.55} />
        <Path d="M 0 600 C 80 590 150 610 220 622 C 300 636 350 620 390 614 L 390 844 L 0 844 Z" fill="#A8DC8A" opacity={0.7} />
        {/* grass patches */}
        <G opacity={0.55}>
          <Ellipse cx={300} cy={400} rx={46} ry={12} fill="#D4F2B2" />
          <Ellipse cx={70} cy={560} rx={52} ry={14} fill="#D4F2B2" />
          <Ellipse cx={150} cy={620} rx={40} ry={10} fill="#9CD483" />
          <Ellipse cx={330} cy={660} rx={40} ry={11} fill="#D4F2B2" />
          <Ellipse cx={100} cy={780} rx={60} ry={14} fill="#9CD483" />
        </G>
        {/* paths */}
        <Path d={PATH_1} stroke={SCENE.pathEdge} strokeWidth={42} strokeLinecap="round" fill="none" />
        <Path d={PATH_1} stroke={SCENE.path} strokeWidth={34} strokeLinecap="round" fill="none" />
        <Path d={PATH_1} stroke="#FBEBC8" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 16" fill="none" opacity={0.9} />
        <Path d={PATH_2} stroke={SCENE.pathEdge} strokeWidth={38} fill="none" />
        <Path d={PATH_2} stroke={SCENE.path} strokeWidth={31} fill="none" />
        {/* river */}
        <Path d={RIVER} stroke="#DDF1FD" strokeWidth={84} fill="none" />
        <Path d={RIVER} stroke="#F2E2B8" strokeWidth={76} fill="none" opacity={0.6} />
        <Path d={RIVER} stroke={g('river')} strokeWidth={64} fill="none" />
        <Path d="M 118 468 C 132 460 152 462 154 468 C 148 473 128 474 118 468 Z" fill="#F4E3B8" />
        <Path d="M 256 602 C 264 596 278 598 278 604 C 272 608 260 608 256 602 Z" fill="#F4E3B8" />
        {/* top-left forest */}
        <Tree x={18} y={326} h={104} />
        <Tree x={48} y={320} h={81} tone="light" />
        <Tree x={80} y={330} h={96} />
        <Tree x={112} y={320} h={68} tone="light" />
        <Tree x={144} y={334} h={81} />
        <Tree x={36} y={360} h={60} tone="light" />
        {/* east hills */}
        <Tree x={352} y={392} h={96} />
        <Tree x={378} y={414} h={68} tone="light" />
        <Tree x={326} y={416} h={57} tone="light" />
        {/* farmhouse */}
        <House x={110} y={392} s={1.22} />
        <RoundTree x={56} y={400} r={17} />
        <RoundTree x={168} y={404} r={14} tone="light" />
        <Bush x={196} y={414} s={0.91} tone="deep" />
        {/* river-bank building */}
        <G transform="translate(290 522) scale(1.25) translate(-290 -522)">
          <Rect x={284} y={482} width={42} height={40} rx={2} fill="#F06660" />
          <Rect x={299} y={498} width={12} height={24} rx={2} fill="#3A6FD8" />
          <Path d="M 278 486 L 305 456 L 332 486 Z" fill="#2F63D6" />
          <Circle cx={305} cy={474} r={6} fill="#FFFFFF" />
          <Rect x={254} y={490} width={30} height={32} fill="#9CC4F7" />
          <Path d="M 250 492 L 269 474 L 288 492 Z" fill="#6E9DF0" />
        </G>
        <Tree x={362} y={548} h={86} tone="light" />
        <Tree x={380} y={590} h={62} />
        {/* lower left */}
        <Lighthouse x={70} y={676} s={1.3} />
        <Tree x={128} y={638} h={75} tone="light" />
        <Tree x={20} y={642} h={65} tone="light" />
        <Tree x={26} y={724} h={96} />
        <Tree x={118} y={724} h={62} />
        <House x={162} y={684} s={0.82} roof="#F0915A" wall="#FCE9CF" door="#3A86F0" />
        <Bush x={98} y={690} s={0.91} />
        {/* lower right */}
        <Tree x={366} y={720} h={99} />
        <Tree x={298} y={764} h={73} tone="light" />
        <Tree x={360} y={796} h={81} />
        <Bush x={236} y={734} s={1.04} tone="deep" />
        <Bush x={60} y={806} s={1.43} tone="deep" />
        <Bush x={250} y={806} s={1.17} />
        <Bush x={150} y={776} s={1.04} />
        {/* tufts & flowers */}
        <Tuft x={60} y={552} s={1.2} />
        <Tuft x={330} y={404} s={1.1} />
        <Tuft x={160} y={560} s={1} />
        <Tuft x={292} y={660} s={1.1} />
        <Tuft x={190} y={782} s={1} />
        <G>
          <Circle cx={36} cy={548} r={2.3} fill="#FFFFFF" />
          <Circle cx={322} cy={426} r={2.3} fill="#FDE38A" />
          <Circle cx={182} cy={746} r={2.3} fill="#FFFFFF" />
          <Circle cx={264} cy={380} r={2} fill="#FDE38A" />
          <Circle cx={96} cy={600} r={2} fill="#FFB3C2" />
          <Circle cx={340} cy={640} r={2} fill="#FFB3C2" />
        </G>
      </StageLayer>
      <SwayGroup pivot={[216, 530]} phase={1}>
        <Tree x={216} y={530} h={109} />
      </SwayGroup>
      <SwayGroup pivot={[182, 544]} phase={2}>
        <Tree x={182} y={544} h={73} tone="light" />
      </SwayGroup>
      <RiverShimmer />
      <Flag />
      <Birds />
      <Clouds />
    </>
  );
}

export function WorldMap({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <Stage vbW={WORLD_VB.w} vbH={WORLD_VB.h} fit="slice" align="center" style={style}>
      <WorldMapArt />
      {children}
    </Stage>
  );
}

export { StageNode as MapNode };

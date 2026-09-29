/**
 * Illustrated scenes for stories, quests and coach views. Each scene is
 * authored in its own viewBox and laid out with <Stage> so characters and
 * animated props stay registered to the art.
 */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Pip } from '@/components/characters/Buddies';
import { Fox, type FoxPose } from '@/components/characters/fox/Fox';
import { Aiden } from '@/components/characters/People';
import { useOscillator } from '@/components/characters/anim';
import type { SceneId } from '@/content/types';
import { useMotionLevel } from '@/lib/motion';
import { useUid } from '@/lib/uid';

import { Bench, Bush, CloudShape, House, Mountain, SCENE, SunDisk, SunRays, Tree, Tuft } from './elements';
import { Stage, StageLayer, StageNode } from './Stage';

/* ------------------------------------------------------------------ */
/* Shared animated bits                                                */
/* ------------------------------------------------------------------ */

function DriftClouds({ clouds }: { clouds: { x: number; y: number; s: number }[] }) {
  const level = useMotionLevel();
  const t = useOscillator(level !== 'off', 8000);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (t.value - 0.5) * 14 }] }));
  return (
    <StageLayer style={style}>
      {clouds.map((c, i) => (
        <CloudShape key={i} x={c.x} y={c.y} s={c.s} />
      ))}
    </StageLayer>
  );
}

function SpinSun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const level = useMotionLevel();
  const t = useOscillator(level !== 'off', 3000);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value * 18}deg` }, { scale: 0.95 + t.value * 0.08 }] }));
  return (
    <>
      <StageLayer style={style} pivotAt={[cx, cy]}>
        <SunRays cx={cx} cy={cy} r={r} count={10} len={0.45} width={0.13} />
      </StageLayer>
      <StageLayer>
        <SunDisk cx={cx} cy={cy} r={r} />
      </StageLayer>
    </>
  );
}

function SkyDefs({ id, top = SCENE.skyTop, bottom = SCENE.skyBottom }: { id: string; top?: string; bottom?: string }) {
  return (
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={top} />
        <Stop offset="1" stopColor={bottom} />
      </LinearGradient>
    </Defs>
  );
}

/* ------------------------------------------------------------------ */
/* Playroom — Pip and the fallen tower (06)                           */
/* ------------------------------------------------------------------ */

export function PlayroomScene({ style, mood = 'frustrated' }: { style?: StyleProp<ViewStyle>; mood?: 'frustrated' | 'happy' }) {
  const u = useUid('pr');
  return (
    <Stage vbW={390} vbH={380} fit="slice" align="bottom" style={style}>
      <StageLayer>
        <Defs>
          <LinearGradient id={`${u}w`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#DCE4F8" />
            <Stop offset="1" stopColor="#EEF0FA" />
          </LinearGradient>
          <LinearGradient id={`${u}f`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F9E3CC" />
            <Stop offset="1" stopColor="#F4D3B4" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={390} height={380} fill={`url(#${u}w)`} />
        <Rect x={0} y={220} width={390} height={160} fill={`url(#${u}f)`} />
        <Rect x={0} y={214} width={390} height={10} fill="#F6DCC1" />
        {/* plant */}
        <G>
          <Path d="M 48 170 C 30 150 20 116 26 92 C 42 108 52 136 54 166 Z" fill="#3E9E77" />
          <Path d="M 58 168 C 56 130 66 96 86 80 C 90 110 80 142 66 170 Z" fill="#4BB083" />
          <Path d="M 62 170 C 74 144 96 124 120 118 C 114 144 94 164 70 174 Z" fill="#3E9E77" />
          <Path d="M 40 172 C 28 158 8 150 -4 152 C 6 170 24 178 42 178 Z" fill="#4BB083" />
          <Path d="M 22 176 L 96 176 L 88 226 L 30 226 Z" fill="#E8A77A" />
          <Rect x={18} y={170} width={82} height={12} rx={4} fill="#EDB48A" />
        </G>
        {/* shelf with blocks */}
        <G>
          <Rect x={272} y={116} width={118} height={10} rx={3} fill="#F2CFA8" />
          <Rect x={330} y={126} width={12} height={94} fill="#EFC79E" />
          <Rect x={292} y={84} width={30} height={32} rx={3} fill="#AFC4F5" />
          <Rect x={326} y={70} width={32} height={46} rx={3} fill="#F7B6CC" />
          <Rect x={338} y={48} width={22} height={24} rx={3} fill="#F9C9D8" />
        </G>
        {/* tower (right) */}
        <G>
          <Rect x={312} y={248} width={52} height={44} rx={4} fill="#3F86F0" />
          <Rect x={300} y={204} width={58} height={46} rx={4} fill="#F7C23C" />
          <Rect x={308} y={160} width={48} height={46} rx={4} fill="#4CC478" />
          <Rect x={314} y={130} width={32} height={32} rx={4} fill="#9ED9CF" />
        </G>
        <Ellipse cx={195} cy={322} rx={120} ry={12} fill="#E6BF98" opacity={0.5} />
      </StageLayer>
      <StageNode x={195} y={318} w={220} h={220} anchor="bottom">
        {({ width }) => <Pip size={width} mood={mood} />}
      </StageNode>
      <StageLayer>
        {/* scattered blocks in front */}
        <Rect x={36} y={272} width={62} height={52} rx={5} fill="#EE4E55" />
        <Path d="M 36 277 L 44 266 L 106 266 L 98 277 Z" fill="#F57A7E" />
        <Rect x={150} y={286} width={56} height={46} rx={5} fill="#F7C23C" />
        <Path d="M 150 290 L 158 280 L 214 280 L 206 290 Z" fill="#FAD66E" />
        <Rect x={226} y={280} width={58} height={50} rx={5} fill="#3F86F0" />
        <Path d="M 226 285 L 234 274 L 292 274 L 284 285 Z" fill="#6AA3F6" />
      </StageLayer>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Bedroom — Aiden's story (13)                                       */
/* ------------------------------------------------------------------ */

export function BedroomScene({ style }: { style?: StyleProp<ViewStyle> }) {
  const u = useUid('br');
  return (
    <Stage vbW={390} vbH={360} fit="slice" align="bottom" style={style}>
      <StageLayer>
        <Defs>
          <LinearGradient id={`${u}w`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FCEBD6" />
            <Stop offset="1" stopColor="#F9E2C6" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={390} height={360} fill={`url(#${u}w)`} />
        {/* window */}
        <Rect x={-6} y={40} width={88} height={96} rx={4} fill="#E8C49C" />
        <Rect x={2} y={48} width={72} height={80} rx={2} fill="#CFE8FB" />
        <Path d="M 2 104 C 20 92 40 96 56 108 L 74 108 L 74 128 L 2 128 Z" fill="#8CCB7A" />
        <Circle cx={20} cy={96} r={14} fill="#5BB06A" />
        {/* poster */}
        <Rect x={250} y={30} width={96} height={100} rx={4} fill="#6FA7F2" />
        <Rect x={258} y={38} width={80} height={84} rx={2} fill="#9CC6F8" />
        <Circle cx={298} cy={80} r={28} fill="#FFFFFF" />
        <Path d="M 298 66 L 309 74 L 305 88 L 291 88 L 287 74 Z" fill="#1C2860" />
        <Path d="M 298 52 L 298 58 M 322 72 L 316 74 M 314 104 L 309 98 M 282 104 L 287 98 M 274 72 L 280 74" stroke="#1C2860" strokeWidth={4} strokeLinecap="round" />
        <Rect x={352} y={26} width={40} height={110} fill="#F1D6B6" />
        {/* bed */}
        <Rect x={236} y={150} width={160} height={70} rx={10} fill="#E2B384" />
        <Path d="M 230 150 C 260 132 330 130 396 138 L 396 190 L 230 190 Z" fill="#3C74DF" />
        <Path d="M 238 146 C 270 136 330 136 396 142" stroke="#5B92EE" strokeWidth={6} fill="none" />
        <Path d="M 244 162 C 280 154 330 154 396 160 M 244 176 C 280 168 330 168 396 174" stroke="#2F5FC8" strokeWidth={3} opacity={0.6} fill="none" />
        <Rect x={236} y={214} width={160} height={30} fill="#D9A574" />
        {/* shelf */}
        <Rect x={0} y={176} width={70} height={100} fill="#E7BA8C" />
        <Rect x={0} y={206} width={70} height={6} fill="#D9A574" />
        <Rect x={6} y={184} width={10} height={22} fill="#6FA7F2" />
        <Rect x={18} y={188} width={9} height={18} fill="#8CCB7A" />
        <Rect x={29} y={182} width={10} height={24} fill="#F2A65E" />
        {/* floor */}
        <Rect x={0} y={262} width={390} height={98} fill="#F2CFA6" />
        <Path d="M 0 262 L 390 262" stroke="#E4B88C" strokeWidth={3} />
        <Path d="M 0 300 L 390 300 M 0 336 L 390 336" stroke="#EBC293" strokeWidth={2} />
        {/* backpack */}
        <G>
          <Path d="M 286 222 C 286 206 330 206 330 222" stroke="#2A5CC4" strokeWidth={7} fill="none" />
          <Rect x={262} y={218} width={92} height={92} rx={20} fill="#2F68D8" />
          <Rect x={272} y={228} width={72} height={30} rx={10} fill="#1F4FB8" />
          <Rect x={282} y={232} width={52} height={16} rx={6} fill="#5CD3A6" />
          <Rect x={276} y={266} width={64} height={34} rx={10} fill="#4A82EA" />
        </G>
        {/* soccer ball */}
        <G>
          <Circle cx={46} cy={300} r={38} fill="#FFFFFF" stroke="#D5DBE8" strokeWidth={2} />
          <Path d="M 46 284 L 60 294 L 55 311 L 37 311 L 32 294 Z" fill="#1C2860" />
          <Path d="M 46 262 L 46 272 M 80 290 L 72 294 M 70 330 L 62 322 M 22 330 L 30 322 M 12 290 L 20 294" stroke="#1C2860" strokeWidth={7} strokeLinecap="round" />
        </G>
      </StageLayer>
      <StageNode x={170} y={338} w={230} h={253} anchor="bottom">
        {({ height }) => <Aiden size={height} />}
      </StageNode>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Outdoor scenes                                                      */
/* ------------------------------------------------------------------ */

function Meadow({ u, vbW, vbH, horizon }: { u: string; vbW: number; vbH: number; horizon: number }) {
  return (
    <>
      <SkyDefs id={`${u}sky`} />
      <Rect x={0} y={0} width={vbW} height={vbH} fill={`url(#${u}sky)`} />
      <Path d={`M 0 ${horizon + 8} C ${vbW * 0.25} ${horizon - 10} ${vbW * 0.55} ${horizon - 4} ${vbW} ${horizon + 6} L ${vbW} ${vbH} L 0 ${vbH} Z`} fill={SCENE.hillFar} />
      <Path d={`M 0 ${horizon + 30} C ${vbW * 0.3} ${horizon + 14} ${vbW * 0.7} ${horizon + 20} ${vbW} ${horizon + 34} L ${vbW} ${vbH} L 0 ${vbH} Z`} fill={SCENE.grass} />
    </>
  );
}

/** Home on the hill — Real-World Quest headers (09, 18). */
export function HouseScene({ style, compact = false }: { style?: StyleProp<ViewStyle>; compact?: boolean }) {
  const u = useUid('hs');
  const vbH = compact ? 170 : 230;
  return (
    <Stage vbW={390} vbH={vbH} fit="slice" align="bottom" style={style}>
      <StageLayer>
        <SkyDefs id={`${u}sky`} />
        <Rect x={0} y={0} width={390} height={vbH} fill={`url(#${u}sky)`} />
        <Mountain x={150} y={vbH - 40} w={180} h={110} color="#9CBEF3" />
        <Mountain x={260} y={vbH - 40} w={200} h={120} color="#88B0F0" />
        <Mountain x={360} y={vbH - 40} w={130} h={80} color="#A9C8F5" />
        <Path d={`M 0 ${vbH - 50} C 100 ${vbH - 66} 280 ${vbH - 66} 390 ${vbH - 48} L 390 ${vbH} L 0 ${vbH} Z`} fill={SCENE.hillMid} />
        <Path d={`M 0 ${vbH - 30} C 120 ${vbH - 44} 260 ${vbH - 42} 390 ${vbH - 28} L 390 ${vbH} L 0 ${vbH} Z`} fill={SCENE.grass} />
        <House x={196} y={vbH - 40} s={1.35} />
        <Bush x={250} y={vbH - 36} s={0.7} tone="deep" />
        <Bush x={150} y={vbH - 34} s={0.6} />
      </StageLayer>
      <DriftClouds clouds={[{ x: 70, y: 30, s: 0.6 }, { x: 330, y: 22, s: 0.5 }]} />
      <StageLayer>
        <Tree x={40} y={vbH - 30} h={96} />
        <Tree x={96} y={vbH - 38} h={70} tone="light" />
        <Tree x={292} y={vbH - 40} h={72} tone="light" />
        <Tree x={342} y={vbH - 26} h={112} />
      </StageLayer>
    </Stage>
  );
}

/** Park with bench — Real-World Observation (33). */
export function ParkScene({ style, pose = 'walk' }: { style?: StyleProp<ViewStyle>; pose?: FoxPose }) {
  const u = useUid('pk');
  return (
    <Stage vbW={360} vbH={230} fit="slice" style={style}>
      <StageLayer>
        <Meadow u={u} vbW={360} vbH={230} horizon={120} />
        <Path d="M 90 230 C 120 190 200 176 300 170 L 360 168 L 360 186 C 280 190 200 200 170 230 Z" fill={SCENE.path} />
        <Tree x={40} y={170} h={100} />
        <Tree x={90} y={166} h={70} tone="light" />
        <Tree x={250} y={160} h={70} tone="light" />
        <Tree x={320} y={168} h={104} />
        <Bench x={292} y={190} s={1.1} />
        <Bush x={30} y={222} s={1.1} tone="deep" />
        <Bush x={340} y={226} s={1} />
        <Tuft x={200} y={200} />
      </StageLayer>
      <SpinSun cx={286} cy={40} r={20} />
      <DriftClouds clouds={[{ x: 110, y: 34, s: 0.55 }, { x: 340, y: 80, s: 0.4 }]} />
      <StageNode x={170} y={226} w={200} h={200} anchor="bottom">
        {({ height }) => <Fox pose={pose} size={height} />}
      </StageNode>
    </Stage>
  );
}

/** Bookshelf — Help Hero. */
export function ShelfScene({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Stage vbW={390} vbH={380} fit="slice" align="bottom" style={style}>
      <StageLayer>
        <Rect x={0} y={0} width={390} height={380} fill="#E6EEFB" />
        <Rect x={0} y={250} width={390} height={130} fill="#F4D9BB" />
        <Rect x={236} y={20} width={140} height={250} rx={6} fill="#D9A574" />
        <Rect x={246} y={30} width={120} height={230} fill="#EBC293" />
        {[80, 140, 200].map((y) => (
          <Rect key={y} x={246} y={y} width={120} height={8} fill="#D9A574" />
        ))}
        <Rect x={296} y={46} width={16} height={34} rx={2} fill="#F25F6F" />
        <Rect x={314} y={50} width={14} height={30} rx={2} fill="#3F86F0" />
        <Rect x={330} y={44} width={18} height={36} rx={2} fill="#4CC478" />
        {[[254, 106], [270, 110], [288, 104], [320, 112]].map(([x, y], i) => (
          <Rect key={i} x={x} y={y} width={14} height={140 - y + 0} rx={2} fill={['#F7C23C', '#B690FA', '#7CBCFC', '#F7839C'][i]} />
        ))}
        <Rect x={258} y={168} width={40} height={32} rx={4} fill="#F7B6CC" />
        <Rect x={306} y={172} width={46} height={28} rx={4} fill="#AFC4F5" />
        <Circle cx={320} cy={38} r={10} fill="#FDC53A" opacity={0.6} />
      </StageLayer>
      <StageNode x={130} y={362} w={280} h={280} anchor="bottom">
        {({ height }) => <Fox pose="wave" size={height} expression="smile" />}
      </StageNode>
    </Stage>
  );
}

/** Tricky puzzle — Help Hero round 2. */
export function PuzzleScene({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Stage vbW={390} vbH={380} fit="slice" align="bottom" style={style}>
      <StageLayer>
        <Rect x={0} y={0} width={390} height={380} fill="#E3EBF9" />
        <Rect x={0} y={236} width={390} height={144} fill="#F4D9BB" />
        <Circle cx={70} cy={80} r={34} fill="#FFFFFF" opacity={0.7} />
        <Path d="M 70 56 L 70 80 L 88 90" stroke="#9AA8D8" strokeWidth={4} strokeLinecap="round" fill="none" />
      </StageLayer>
      <StageNode x={195} y={300} w={220} h={220} anchor="bottom">
        {({ width }) => <Pip size={width} mood="frustrated" />}
      </StageNode>
      <StageLayer>
        <Rect x={40} y={290} width={310} height={70} rx={12} fill="#E7BA8C" />
        <G>
          <Path d="M 80 306 L 110 306 C 110 298 122 298 122 306 L 150 306 L 150 336 L 80 336 Z" fill="#4CC478" />
          <Path d="M 170 312 L 200 312 L 200 322 C 208 322 208 334 200 334 L 200 344 L 170 344 Z" fill="#F7C23C" />
          <Path d="M 230 304 L 290 304 L 290 318 C 282 318 282 330 290 330 L 290 340 L 230 340 Z" fill="#3F86F0" />
          <Path d="M 306 314 L 330 314 L 330 344 L 306 344 Z" fill="#F25F6F" />
        </G>
      </StageLayer>
    </Stage>
  );
}

/** Playground with the closed slide — Flexi-Fix. */
export function PlaygroundScene({ style }: { style?: StyleProp<ViewStyle> }) {
  const u = useUid('pg');
  return (
    <Stage vbW={390} vbH={380} fit="slice" align="bottom" style={style}>
      <StageLayer>
        <Meadow u={u} vbW={390} vbH={380} horizon={190} />
        <Tree x={30} y={250} h={120} />
        <Tree x={366} y={246} h={110} tone="light" />
        {/* slide */}
        <G>
          <Rect x={40} y={170} width={10} height={130} fill="#F2A65E" />
          <Rect x={86} y={170} width={10} height={130} fill="#F2A65E" />
          <Rect x={36} y={160} width={64} height={14} rx={4} fill="#F25F6F" />
          <Path d="M 96 170 C 140 200 160 260 190 300 L 170 306 C 140 266 120 214 90 186 Z" fill="#FDC53A" />
          <Path d="M 30 222 L 110 206" stroke="#F25F6F" strokeWidth={4} strokeDasharray="10 6" />
          <Rect x={52} y={200} width={40} height={24} rx={4} fill="#FFFFFF" />
          <Path d="M 60 206 L 84 218 M 84 206 L 60 218" stroke="#F25F6F" strokeWidth={3} strokeLinecap="round" />
        </G>
        {/* swings */}
        <G>
          <Path d="M 276 180 L 256 300 M 276 180 L 296 300 M 356 180 L 336 300 M 356 180 L 376 300 M 270 180 L 362 180" stroke="#3F86F0" strokeWidth={7} strokeLinecap="round" />
          <Path d="M 300 184 L 300 256 M 330 184 L 330 256" stroke="#6E4B3B" strokeWidth={2.4} />
          <Rect x={292} y={254} width={46} height={8} rx={4} fill="#F7C23C" />
        </G>
        <Bush x={200} y={352} s={1.2} tone="deep" />
      </StageLayer>
      <DriftClouds clouds={[{ x: 90, y: 60, s: 0.6 }, { x: 300, y: 40, s: 0.5 }]} />
      <StageNode x={200} y={370} w={240} h={240} anchor="bottom">
        {({ height }) => <Fox pose="wave" size={height} expression="smile" />}
      </StageNode>
    </Stage>
  );
}

/** Aspect ratio (width / height) each story scene is authored at. */
export const SCENE_ASPECT: Record<SceneId, number> = {
  playroom: 390 / 380,
  bedroom: 390 / 360,
  shelf: 390 / 380,
  puzzle: 390 / 380,
  playground: 390 / 380,
  house: 390 / 230,
  kitchen: 390 / 380,
};

/** Colour at the top edge of each scene, used to extend it into taller frames. */
export const SCENE_TOP: Record<SceneId, string> = {
  playroom: '#DCE4F8',
  bedroom: '#FCEBD6',
  shelf: '#E6EEFB',
  puzzle: '#E3EBF9',
  playground: SCENE.skyTop,
  house: SCENE.skyTop,
  kitchen: '#DCE4F8',
};

export function StoryScene({ scene, style }: { scene: SceneId; style?: StyleProp<ViewStyle> }): ReactNode {
  switch (scene) {
    case 'bedroom':
      return <BedroomScene style={style} />;
    case 'shelf':
      return <ShelfScene style={style} />;
    case 'puzzle':
      return <PuzzleScene style={style} />;
    case 'playground':
      return <PlaygroundScene style={style} />;
    case 'house':
      return <HouseScene style={style} />;
    case 'playroom':
    default:
      return <PlayroomScene style={style} />;
  }
}

/**
 * Finn the fox — vector parts.
 *
 * Head parts are authored in a local frame centred on the face (eyes at y≈2,
 * chin at y≈56, ear tips at y≈-100). Body parts are authored per pose in the
 * pose's own viewBox. Every gradient id is prefixed so several foxes (and
 * several rig layers) can coexist on one web page.
 */
import { memo } from 'react';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export const FOX = {
  fur: '#F4772E',
  furLight: '#FB9650',
  furDeep: '#E2601F',
  furShade: '#D9561A',
  cream: '#FFF7EE',
  creamShade: '#F4E1D2',
  bib: '#FCE6DA',
  dark: '#4E2518',
  darkLight: '#77402A',
  earInner: '#F6A28E',
  earInnerLight: '#FBC8B6',
  eye: '#1C1413',
  nose: '#2A1918',
  mouth: '#6B2420',
  tongue: '#F27D8C',
  blush: '#FF8C7A',
  pack: '#2C73E0',
  packLight: '#4B94F4',
  packDeep: '#1A52B4',
  packAccent: '#35C2A0',
  book: '#2F7BEA',
  bookLight: '#5A9CF5',
  bookPage: '#F7FAFF',
} as const;

export type Eyes = 'open' | 'joy' | 'calm' | 'down' | 'side';
export type Mouth = 'open' | 'big' | 'smile' | 'calm' | 'o' | 'flat';

export type Expression = 'happy' | 'joy' | 'calm' | 'focus' | 'smile' | 'surprised' | 'sleepy';

export const EXPRESSIONS: Record<Expression, { eyes: Eyes; mouth: Mouth; blush: number }> = {
  happy: { eyes: 'open', mouth: 'open', blush: 0.3 },
  joy: { eyes: 'joy', mouth: 'big', blush: 0.45 },
  calm: { eyes: 'calm', mouth: 'calm', blush: 0.35 },
  sleepy: { eyes: 'calm', mouth: 'smile', blush: 0.35 },
  focus: { eyes: 'down', mouth: 'smile', blush: 0.28 },
  smile: { eyes: 'open', mouth: 'smile', blush: 0.3 },
  surprised: { eyes: 'open', mouth: 'o', blush: 0.3 },
};

/** Gradient definitions. `p` is the unique id prefix for this sheet. */
export const FoxDefs = memo(function FoxDefs({ p }: { p: string }) {
  return (
    <Defs>
      <RadialGradient id={`${p}fur`} cx="50%" cy="30%" rx="62%" ry="70%" fx="50%" fy="28%">
        <Stop offset="0" stopColor={FOX.furLight} />
        <Stop offset="0.62" stopColor={FOX.fur} />
        <Stop offset="1" stopColor={FOX.furDeep} />
      </RadialGradient>
      <LinearGradient id={`${p}limb`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={FOX.furLight} />
        <Stop offset="1" stopColor={FOX.furDeep} />
      </LinearGradient>
      <LinearGradient id={`${p}body`} x1="0.2" y1="0" x2="0.8" y2="1">
        <Stop offset="0" stopColor={FOX.furLight} />
        <Stop offset="0.55" stopColor={FOX.fur} />
        <Stop offset="1" stopColor={FOX.furDeep} />
      </LinearGradient>
      <LinearGradient id={`${p}ear`} x1="0.35" y1="0" x2="0.6" y2="1">
        <Stop offset="0" stopColor={FOX.dark} />
        <Stop offset="0.3" stopColor="#8A4121" />
        <Stop offset="0.58" stopColor={FOX.fur} />
        <Stop offset="1" stopColor={FOX.fur} />
      </LinearGradient>
      <LinearGradient id={`${p}earIn`} x1="0.4" y1="0" x2="0.5" y2="1">
        <Stop offset="0" stopColor="#E98673" />
        <Stop offset="1" stopColor={FOX.earInnerLight} />
      </LinearGradient>
      <RadialGradient id={`${p}cream`} cx="50%" cy="35%" rx="60%" ry="70%">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="0.7" stopColor={FOX.cream} />
        <Stop offset="1" stopColor={FOX.creamShade} />
      </RadialGradient>
      <LinearGradient id={`${p}paw`} x1="0" y1="0" x2="0.6" y2="1">
        <Stop offset="0" stopColor={FOX.darkLight} />
        <Stop offset="1" stopColor={FOX.dark} />
      </LinearGradient>
      <LinearGradient id={`${p}pack`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={FOX.packLight} />
        <Stop offset="0.6" stopColor={FOX.pack} />
        <Stop offset="1" stopColor={FOX.packDeep} />
      </LinearGradient>
      <LinearGradient id={`${p}tail`} x1="1" y1="1" x2="0" y2="0">
        <Stop offset="0" stopColor={FOX.furDeep} />
        <Stop offset="0.5" stopColor={FOX.fur} />
        <Stop offset="1" stopColor={FOX.furLight} />
      </LinearGradient>
      <LinearGradient id={`${p}book`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={FOX.bookLight} />
        <Stop offset="1" stopColor={FOX.book} />
      </LinearGradient>
    </Defs>
  );
});

const u = (p: string, name: string) => `url(#${p}${name})`;

/* ------------------------------------------------------------------------ */
/* Head (local frame)                                                        */
/* ------------------------------------------------------------------------ */

const EAR_OUTER =
  'M -63 -4 C -72 -34 -69 -66 -57 -93 C -39 -86 -22 -68 -9 -46 C -26 -40 -47 -26 -63 -4 Z';
const EAR_INNER =
  'M -54 -27 C -59 -47 -58 -63 -53 -77 C -41 -70 -32 -59 -24 -47 C -34 -42 -46 -35 -54 -27 Z';
const EAR_FLUFF =
  'M -56 -23 L -52 -36 L -47 -28 L -43 -40 L -39 -31 L -34 -43 L -30 -35 L -23 -44 C -32 -35 -45 -28 -56 -23 Z';

export function Ear({ p, side }: { p: string; side: 'left' | 'right' }) {
  return (
    <G transform={side === 'right' ? 'scale(-1 1)' : undefined}>
      <Path d={EAR_OUTER} fill={u(p, 'ear')} />
      <Path d={EAR_INNER} fill={u(p, 'earIn')} />
      <Path d={EAR_FLUFF} fill={FOX.cream} opacity={0.95} />
    </G>
  );
}

/** Ear base pivot (local frame) used to twitch each ear. */
export const EAR_PIVOT = { left: { x: -38, y: -34 }, right: { x: 38, y: -34 } };

const HEAD_BASE =
  'M 0 -53 C 29 -53 51 -41 58 -18 C 61 -9 62 -2 64 4 L 78 8 L 68 15 L 76 22 L 64 27 C 59 37 50 45 38 50 C 26 55 12 57 0 57 C -12 57 -26 55 -38 50 C -50 45 -59 37 -64 27 L -76 22 L -68 15 L -78 8 L -64 4 C -62 -2 -61 -9 -58 -18 C -51 -41 -29 -53 0 -53 Z';
const HEAD_TUFT =
  'M -14 -50 C -10 -58 -5 -62 1 -66 C 0 -60 1 -56 3 -52 C 6 -58 10 -61 15 -62 C 13 -57 13 -52 14 -48 Z';
const MUZZLE =
  'M -62 15 C -56 5 -46 6 -37 12 C -26 19 -12 15 0 13 C 12 15 26 19 37 12 C 46 6 56 5 62 15 L 72 21 L 62 26 L 68 32 C 55 46 31 56 0 56 C -31 56 -55 46 -68 32 L -62 26 L -72 21 Z';

export function HeadBase({ p }: { p: string }) {
  return (
    <G>
      <Path d={HEAD_TUFT} fill={FOX.furLight} />
      <Path d={HEAD_BASE} fill={u(p, 'fur')} />
      {/* cream face mask: two eye patches + muzzle */}
      <Ellipse cx={-25} cy={1} rx={21} ry={20} fill={u(p, 'cream')} />
      <Ellipse cx={25} cy={1} rx={21} ry={20} fill={u(p, 'cream')} />
      <Path d={MUZZLE} fill={u(p, 'cream')} />
    </G>
  );
}

export function Blush({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <G opacity={opacity}>
      <Ellipse cx={-43} cy={19} rx={8.5} ry={4.8} fill={FOX.blush} />
      <Ellipse cx={43} cy={19} rx={8.5} ry={4.8} fill={FOX.blush} />
    </G>
  );
}

export function Nose() {
  return (
    <G>
      <Path
        d="M -7 12 C -7 8.8 7 8.8 7 12 C 7 15.8 3 19 0 19 C -3 19 -7 15.8 -7 12 Z"
        fill={FOX.nose}
      />
      <Ellipse cx={-2.2} cy={11.2} rx={2.4} ry={1.2} fill="#FFFFFF" opacity={0.45} />
    </G>
  );
}

/** Eye centre in the local head frame. */
export const EYE_Y = 2;

function OpenEye({ x, look = 0, lookY = 0 }: { x: number; look?: number; lookY?: number }) {
  return (
    <G>
      <Ellipse cx={x + look} cy={EYE_Y + 1 + lookY} rx={9.8} ry={12.2} fill={FOX.eye} />
      <Circle cx={x + look + 3.6} cy={EYE_Y - 3.4 + lookY} r={4} fill="#FFFFFF" />
      <Circle cx={x + look - 3} cy={EYE_Y + 6.4 + lookY} r={1.7} fill="#FFFFFF" opacity={0.85} />
    </G>
  );
}

export function EyesPart({ kind }: { kind: Eyes }) {
  if (kind === 'joy') {
    return (
      <G fill="none" stroke={FOX.eye} strokeWidth={3.8} strokeLinecap="round">
        <Path d="M -35 7 Q -25 -6 -15 7" />
        <Path d="M 15 7 Q 25 -6 35 7" />
      </G>
    );
  }
  if (kind === 'calm') {
    return (
      <G fill="none" stroke={FOX.eye} strokeWidth={3.4} strokeLinecap="round">
        <Path d="M -35 2 Q -25 11 -15 2" />
        <Path d="M 15 2 Q 25 11 35 2" />
        <Path d="M -35 2 L -38.5 -0.5" strokeWidth={2.4} />
        <Path d="M 35 2 L 38.5 -0.5" strokeWidth={2.4} />
      </G>
    );
  }
  if (kind === 'down') {
    return (
      <G>
        <OpenEye x={-25} look={0} lookY={3} />
        <OpenEye x={25} look={0} lookY={3} />
        {/* relaxed upper lids for a reading gaze */}
        <Path d="M -37 -9 Q -25 -16 -13 -9 L -13 -3 Q -25 -8 -37 -3 Z" fill={FOX.cream} />
        <Path d="M 13 -9 Q 25 -16 37 -9 L 37 -3 Q 25 -8 13 -3 Z" fill={FOX.cream} />
      </G>
    );
  }
  if (kind === 'side') {
    return (
      <G>
        <OpenEye x={-25} look={2.5} />
        <OpenEye x={25} look={2.5} />
      </G>
    );
  }
  return (
    <G>
      <OpenEye x={-25} />
      <OpenEye x={25} />
    </G>
  );
}

export function MouthPart({ kind }: { kind: Mouth }) {
  const philtrum = <Path d="M 0 18.5 L 0 22.5" stroke={FOX.nose} strokeWidth={1.8} strokeLinecap="round" />;
  switch (kind) {
    case 'big':
      return (
        <G>
          {philtrum}
          <Path d="M -15 21.5 C -8 25 8 25 15 21.5 C 14 35 7 41.5 0 41.5 C -7 41.5 -14 35 -15 21.5 Z" fill={FOX.mouth} />
          <Path d="M -9 34 C -5 29.5 5 29.5 9 34 C 7 39.5 3 41.5 0 41.5 C -3 41.5 -7 39.5 -9 34 Z" fill={FOX.tongue} />
        </G>
      );
    case 'smile':
      return (
        <G fill="none" stroke={FOX.nose} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M 0 18.5 L 0 23" />
          <Path d="M -10 22 Q -5 28 0 23 Q 5 28 10 22" />
        </G>
      );
    case 'calm':
      return (
        <G>
          {philtrum}
          <Path d="M -8 22.5 C -4 24.8 4 24.8 8 22.5 C 7 29 3.5 31.5 0 31.5 C -3.5 31.5 -7 29 -8 22.5 Z" fill={FOX.mouth} />
          <Path d="M -4.5 28.6 C -2 26.5 2 26.5 4.5 28.6 C 3.5 30.8 1.5 31.5 0 31.5 C -1.5 31.5 -3.5 30.8 -4.5 28.6 Z" fill={FOX.tongue} />
        </G>
      );
    case 'o':
      return (
        <G>
          {philtrum}
          <Ellipse cx={0} cy={29} rx={5.5} ry={6.5} fill={FOX.mouth} />
          <Ellipse cx={0} cy={31.5} rx={3.4} ry={3} fill={FOX.tongue} />
        </G>
      );
    case 'flat':
      return (
        <G fill="none" stroke={FOX.nose} strokeWidth={2.2} strokeLinecap="round">
          <Path d="M 0 18.5 L 0 23" />
          <Path d="M -7 25 Q 0 23 7 25" />
        </G>
      );
    case 'open':
    default:
      return (
        <G>
          {philtrum}
          <Path d="M -12.5 22 C -6 25.2 6 25.2 12.5 22 C 11.5 32.5 6 37.5 0 37.5 C -6 37.5 -11.5 32.5 -12.5 22 Z" fill={FOX.mouth} />
          <Path d="M -7.5 31.5 C -4 27.8 4 27.8 7.5 31.5 C 6 35.8 3 37.5 0 37.5 C -3 37.5 -6 35.8 -7.5 31.5 Z" fill={FOX.tongue} />
        </G>
      );
  }
}

/* ------------------------------------------------------------------------ */
/* Shared limb & prop helpers (pose frame)                                   */
/* ------------------------------------------------------------------------ */

export function Paw({ p, cx, cy, rx = 8, ry = 8.5, rot = 0, beans = false }: {
  p: string; cx: number; cy: number; rx?: number; ry?: number; rot?: number; beans?: boolean;
}) {
  return (
    <G transform={`rotate(${rot} ${cx} ${cy})`}>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={u(p, 'paw')} />
      {beans && (
        <G stroke="#2C120B" strokeWidth={2.2} strokeLinecap="round">
          <Path d={`M ${cx - rx * 0.45} ${cy - ry * 0.75} L ${cx - rx * 0.35} ${cy - ry * 0.2}`} />
          <Path d={`M ${cx} ${cy - ry * 0.9} L ${cx} ${cy - ry * 0.3}`} />
          <Path d={`M ${cx + rx * 0.45} ${cy - ry * 0.75} L ${cx + rx * 0.35} ${cy - ry * 0.2}`} />
        </G>
      )}
      <Ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.35} rx={rx * 0.28} ry={ry * 0.18} fill="#FFFFFF" opacity={0.18} />
    </G>
  );
}

export function Foot({ p, cx, cy, w = 26, h = 13, rot = 0 }: {
  p: string; cx: number; cy: number; w?: number; h?: number; rot?: number;
}) {
  return (
    <G transform={`rotate(${rot} ${cx} ${cy})`}>
      <Path
        d={`M ${cx - w / 2} ${cy} C ${cx - w / 2} ${cy - h * 0.9} ${cx + w / 2} ${cy - h * 0.9} ${cx + w / 2} ${cy} C ${cx + w / 2} ${cy + h * 0.55} ${cx - w / 2} ${cy + h * 0.55} ${cx - w / 2} ${cy} Z`}
        fill={u(p, 'paw')}
      />
    </G>
  );
}

/** Classic fox brush: orange sweep with a spiky cream tip. */
export function Tail({ p, flip = false, transform }: { p: string; flip?: boolean; transform?: string }) {
  return (
    <G transform={transform}>
      <G transform={flip ? 'scale(-1 1)' : undefined}>
        <Path
          d="M 2 4 C -22 14 -58 8 -74 -18 C -86 -38 -86 -62 -74 -82 C -62 -70 -50 -58 -40 -44 C -30 -30 -16 -18 4 -12 Z"
          fill={u(p, 'tail')}
        />
        <Path
          d="M -74 -82 C -86 -62 -86 -40 -79 -28 L -72 -36 L -69 -26 L -61 -38 L -56 -31 L -51 -45 C -57 -58 -64 -71 -74 -82 Z"
          fill={FOX.cream}
        />
        <Path d="M -40 -44 C -30 -30 -16 -18 4 -12 L 2 -2 C -18 -6 -34 -20 -44 -36 Z" fill="#FFFFFF" opacity={0.1} />
      </G>
    </G>
  );
}

export function Backpack({ p, x, y, w = 40, h = 70, flip = false }: {
  p: string; x: number; y: number; w?: number; h?: number; flip?: boolean;
}) {
  // A rounded daypack seen from the side: soft top, bulging bottom, front pocket.
  const d = `M ${x + w} ${y + 4} C ${x + w * 0.55} ${y - 2} ${x + 6} ${y + 2} ${x + 2} ${y + h * 0.3} C ${x - 2} ${y + h * 0.55} ${x} ${y + h * 0.85} ${x + w * 0.28} ${y + h} L ${x + w} ${y + h} Z`;
  const pocket = `M ${x + w} ${y + h * 0.5} L ${x + w * 0.3} ${y + h * 0.5} C ${x + w * 0.1} ${y + h * 0.5} ${x + w * 0.06} ${y + h * 0.62} ${x + w * 0.1} ${y + h * 0.78} C ${x + w * 0.14} ${y + h * 0.92} ${x + w * 0.3} ${y + h * 0.95} ${x + w * 0.5} ${y + h * 0.95} L ${x + w} ${y + h * 0.95} Z`;
  return (
    <G transform={flip ? `translate(${2 * x + w} 0) scale(-1 1)` : undefined}>
      <Path d={d} fill={u(p, 'pack')} />
      <Path d={pocket} fill={FOX.packLight} opacity={0.7} />
      <Circle cx={x + w * 0.3} cy={y + h * 0.62} r={2.6} fill={FOX.packAccent} />
      <Path
        d={`M ${x + 7} ${y + h * 0.26} C ${x + 10} ${y + h * 0.14} ${x + w * 0.4} ${y + 5} ${x + w * 0.7} ${y + 4}`}
        stroke="#FFFFFF"
        strokeOpacity={0.35}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

export function Strap({ d }: { d: string }) {
  return <Path d={d} fill={FOX.pack} />;
}

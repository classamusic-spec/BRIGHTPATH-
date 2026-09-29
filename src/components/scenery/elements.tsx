/**
 * Scenery vector primitives (SVG elements, no layout). Used by the backdrop
 * components and illustrated scenes. Style: soft vector, no outlines,
 * teal/mint trees, rolling yellow-green hills (Framework §58).
 */
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

export const SCENE = {
  skyTop: '#CFE9FC',
  skyBottom: '#F1F9FE',
  mountain: '#8DB3EE',
  mountainLight: '#B4CEF5',
  mountainDeep: '#6E98E6',
  hillFar: '#CBEBB0',
  hillMid: '#B5E39A',
  hillNear: '#A2DA88',
  grass: '#C4EB9E',
  grassLight: '#D8F3B6',
  grassDeep: '#8CCF74',
  tree: '#2E9678',
  treeLight: '#44AE8A',
  treeDeep: '#237A62',
  trunk: '#6E4B3B',
  bush: '#4BB083',
  bushDeep: '#379A70',
  path: '#F3DEB2',
  pathEdge: '#E7CA93',
  water: '#78BEF7',
  waterLight: '#B3DDFC',
  cloud: '#FFFFFF',
  sun: '#FDC53F',
  sunLight: '#FFDB6E',
};

/** Tall rounded tree. (x, y) is the base of the trunk; h is total height. */
export function Tree({ x, y, h = 60, tone = 'teal', opacity = 1 }: { x: number; y: number; h?: number; tone?: 'teal' | 'light' | 'deep'; opacity?: number }) {
  const w = h * 0.52;
  const top = y - h;
  const canopyBottom = y - h * 0.22;
  const main = tone === 'light' ? SCENE.treeLight : tone === 'deep' ? SCENE.treeDeep : SCENE.tree;
  const hi = tone === 'deep' ? SCENE.tree : SCENE.treeLight;
  const canopy = `M ${x} ${top} C ${x + w * 0.62} ${top} ${x + w * 0.56} ${canopyBottom} ${x + w * 0.5} ${canopyBottom} C ${x + w * 0.3} ${canopyBottom + h * 0.07} ${x - w * 0.3} ${canopyBottom + h * 0.07} ${x - w * 0.5} ${canopyBottom} C ${x - w * 0.56} ${canopyBottom} ${x - w * 0.62} ${top} ${x} ${top} Z`;
  const half = `M ${x} ${top} C ${x - w * 0.62} ${top} ${x - w * 0.56} ${canopyBottom} ${x - w * 0.5} ${canopyBottom} C ${x - w * 0.3} ${canopyBottom + h * 0.07} ${x - w * 0.05} ${canopyBottom + h * 0.07} ${x} ${canopyBottom + h * 0.06} Z`;
  const tw = Math.max(1.6, h * 0.045);
  return (
    <G opacity={opacity}>
      <Path d={canopy} fill={main} />
      <Path d={half} fill={hi} opacity={0.5} />
      <Path d={`M ${x} ${y} L ${x} ${top + h * 0.34}`} stroke={SCENE.trunk} strokeWidth={tw} strokeLinecap="round" />
      <Path d={`M ${x} ${y - h * 0.36} L ${x - w * 0.24} ${y - h * 0.5}`} stroke={SCENE.trunk} strokeWidth={tw * 0.75} strokeLinecap="round" />
      <Path d={`M ${x} ${y - h * 0.46} L ${x + w * 0.22} ${y - h * 0.6}`} stroke={SCENE.trunk} strokeWidth={tw * 0.75} strokeLinecap="round" />
    </G>
  );
}

/** Round lollipop tree (used on the world map). */
export function RoundTree({ x, y, r = 16, tone = 'teal' }: { x: number; y: number; r?: number; tone?: 'teal' | 'light' }) {
  const main = tone === 'light' ? SCENE.treeLight : SCENE.tree;
  return (
    <G>
      <Path d={`M ${x} ${y} L ${x} ${y - r * 1.4}`} stroke={SCENE.trunk} strokeWidth={Math.max(2, r * 0.16)} strokeLinecap="round" />
      <Ellipse cx={x} cy={y - r * 1.9} rx={r} ry={r * 1.15} fill={main} />
      <Ellipse cx={x - r * 0.35} cy={y - r * 2.15} rx={r * 0.45} ry={r * 0.55} fill={SCENE.treeLight} opacity={0.55} />
    </G>
  );
}

export function Bush({ x, y, s = 1, tone = 'mid' }: { x: number; y: number; s?: number; tone?: 'mid' | 'deep' | 'light' }) {
  const c = tone === 'deep' ? SCENE.bushDeep : tone === 'light' ? '#6CC596' : SCENE.bush;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M -26 0 C -30 -12 -20 -20 -12 -16 C -10 -28 8 -30 12 -18 C 22 -22 30 -12 26 0 Z" fill={c} />
      <Path d="M -14 -14 C -10 -22 0 -24 4 -18" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Grass tuft with 2–3 blades. */
export function Tuft({ x, y, s = 1, color = SCENE.grassDeep }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M -5 0 C -6 -6 -8 -9 -10 -11 C -6 -9 -3 -6 -2 0 Z M 0 0 C 0 -7 1 -11 3 -14 C 3 -9 3 -5 3 0 Z M 4 0 C 6 -5 9 -8 12 -9 C 9 -6 8 -3 7 0 Z" fill={color} />
    </G>
  );
}

export function CloudShape({ x, y, s = 1, opacity = 1 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <Path d="M -40 10 C -48 10 -50 -2 -40 -4 C -40 -16 -24 -20 -16 -12 C -12 -26 10 -28 16 -14 C 24 -20 38 -14 36 -4 C 46 -4 48 10 38 10 Z" fill={SCENE.cloud} />
    </G>
  );
}

/** Sun: disk + rays. Rays are separate so they can rotate. */
export function SunDisk({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={SCENE.sun} />
      <Circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.55} fill={SCENE.sunLight} opacity={0.55} />
    </G>
  );
}

export function SunRays({ cx, cy, r, count = 10, len = 0.42, width = 0.16 }: { cx: number; cy: number; r: number; count?: number; len?: number; width?: number }) {
  const rays = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r1 = r * 1.28;
    const r2 = r * (1.28 + len);
    rays.push(
      <Path
        key={i}
        d={`M ${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1} L ${cx + Math.cos(a) * r2} ${cy + Math.sin(a) * r2}`}
        stroke={SCENE.sun}
        strokeWidth={r * width * 2}
        strokeLinecap="round"
      />,
    );
  }
  return <G>{rays}</G>;
}

/** Brand-mark cloud that sits in front of the rising sun. */
export function BlueCloud({ cx, cy, w }: { cx: number; cy: number; w: number }) {
  const s = w / 100;
  return (
    <G transform={`translate(${cx} ${cy}) scale(${s})`}>
      <Path d="M -50 14 C -58 14 -58 0 -48 -2 C -46 -14 -32 -18 -24 -10 C -18 -26 6 -30 14 -14 C 22 -22 40 -18 40 -4 C 52 -4 56 14 44 14 Z" fill="#3E86EE" />
      <Path d="M -44 14 C -40 6 -28 4 -20 10 C -12 0 8 0 14 10 C 24 4 38 6 42 14 Z" fill="#5B9CF5" opacity={0.7} />
    </G>
  );
}

export function House({ x, y, s = 1, roof = '#EE5A55', wall = '#FCEBD2', door = '#3A86F0' }: { x: number; y: number; s?: number; roof?: string; wall?: string; door?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-30} y={-40} width={60} height={40} fill={wall} />
      <Rect x={10} y={-40} width={20} height={40} fill="#F4D9B8" />
      <Path d="M -38 -38 L 0 -70 L 38 -38 L 32 -34 L 0 -61 L -32 -34 Z" fill={roof} />
      <Path d="M -32 -34 L 0 -61 L 32 -34 L 32 -40 L 0 -66 L -32 -40 Z" fill={roof} />
      <Rect x={16} y={-68} width={7} height={14} fill="#D0473F" />
      <Rect x={-8} y={-26} width={14} height={26} rx={2} fill={door} />
      <Rect x={-24} y={-32} width={11} height={11} rx={1.5} fill="#8CC4FB" />
      <Rect x={16} y={-32} width={9} height={11} rx={1.5} fill="#8CC4FB" />
      <Rect x={-6} y={-54} width={10} height={10} rx={1.5} fill="#8CC4FB" />
    </G>
  );
}

export function Lighthouse({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M -12 0 L -8 -60 L 8 -60 L 12 0 Z" fill="#FFFFFF" />
      <Path d="M -10.4 -24 L -9.2 -40 L 9.2 -40 L 10.4 -24 Z" fill="#F0605E" />
      <Rect x={-10} y={-70} width={20} height={10} rx={2} fill="#F0605E" />
      <Rect x={-6} y={-78} width={12} height={8} fill="#FFE08A" />
      <Path d="M -8 -78 L 0 -88 L 8 -78 Z" fill="#E4504E" />
      <Rect x={-4} y={-12} width={8} height={12} rx={2} fill="#3A6FD8" />
    </G>
  );
}

export function Mountain({ x, y, w, h, color = SCENE.mountain, snow = false }: { x: number; y: number; w: number; h: number; color?: string; snow?: boolean }) {
  return (
    <G>
      <Path d={`M ${x - w / 2} ${y} C ${x - w * 0.3} ${y - h * 0.4} ${x - w * 0.12} ${y - h * 0.96} ${x} ${y - h} C ${x + w * 0.12} ${y - h * 0.96} ${x + w * 0.3} ${y - h * 0.4} ${x + w / 2} ${y} Z`} fill={color} />
      <Path d={`M ${x} ${y - h} C ${x + w * 0.12} ${y - h * 0.96} ${x + w * 0.3} ${y - h * 0.4} ${x + w / 2} ${y} L ${x + w * 0.1} ${y} C ${x + w * 0.08} ${y - h * 0.5} ${x + w * 0.04} ${y - h * 0.8} ${x} ${y - h} Z`} fill="#000000" opacity={0.08} />
      {snow && <Path d={`M ${x - w * 0.09} ${y - h * 0.82} L ${x} ${y - h} L ${x + w * 0.09} ${y - h * 0.82} L ${x + w * 0.03} ${y - h * 0.86} L ${x} ${y - h * 0.8} Z`} fill="#FFFFFF" opacity={0.85} />}
    </G>
  );
}

export function Flag({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M 0 0 L 0 -26" stroke="#3A4A8C" strokeWidth={2} strokeLinecap="round" />
      <Path d="M 0 -26 L 18 -21 L 0 -15 Z" fill="#F0504E" />
    </G>
  );
}

export function Bench({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-26} y={-26} width={52} height={6} rx={2} fill="#A8683F" />
      <Rect x={-26} y={-16} width={52} height={6} rx={2} fill="#B97547" />
      <Rect x={-22} y={-10} width={4} height={10} fill="#7A4A2E" />
      <Rect x={18} y={-10} width={4} height={10} fill="#7A4A2E" />
    </G>
  );
}

export function Star5({ cx, cy, r, fill = '#FDC53A', rot = 0 }: { cx: number; cy: number; r: number; fill?: string; rot?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 - 90 + rot) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.5;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return <Path d={`M ${pts.join(' L ')} Z`} fill={fill} strokeLinejoin="round" stroke={fill} strokeWidth={r * 0.22} />;
}

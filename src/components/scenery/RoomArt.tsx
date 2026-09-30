import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { RoomItemId } from '@/content/rewards';
import { useUid } from '@/lib/uid';

/** Room scene viewBox (Room tab card): use `0 0 390 380` and aspectRatio 390/380. */
export const ROOM_VB = { w: 390, h: 380 };

/** Where the rug sits on the floor (viewBox units): stand the buddy's feet here. */
export const RUG_CENTER = { x: 195, y: 318 };

/** Top-lit gradient in the Icon.tsx style (light top-left to deep bottom-right). */
function Grad({ id, a, b, x2 = 0.4, y2 = 1 }: { id: string; a: string; b: string; x2?: number; y2?: number }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <Stop offset="0" stopColor={a} />
      <Stop offset="1" stopColor={b} />
    </LinearGradient>
  );
}

/** The soft white rim light every item carries. */
const HI = { stroke: '#FFFFFF', strokeOpacity: 0.55, strokeWidth: 1.5, strokeLinecap: 'round', fill: 'none' } as const;

const BOOKS: { x: number; y: number; w: number; a: string; b: string; tilt?: number }[] = [
  { x: 14, y: 40, w: 12, a: '#FAD66E', b: '#EBA91C', tilt: -12 },
  { x: 30, y: 30, w: 14, a: '#F7838E', b: '#E0404F' },
  { x: 46, y: 20, w: 14, a: '#9FE3D9', b: '#4FB8A8' },
  { x: 62, y: 28, w: 14, a: '#6AA3F6', b: '#2466DA' },
  { x: 78, y: 36, w: 10, a: '#C9AEFB', b: '#9270E6' },
];

/** Small item illustrations (reward tiles and the room) — 100×100 art box. */
export function RoomItemArt({ id }: { id: RoomItemId }) {
  const u = useUid('ri');
  const g = (n: string) => `url(#${u}${n})`;
  switch (id) {
    case 'plant':
      return (
        <G>
          <Defs>
            <Grad id={`${u}l`} a="#6FD69A" b="#2E9E62" />
            <Grad id={`${u}r`} a="#4DBB7E" b="#23875A" />
            <Grad id={`${u}p`} a="#F4BE92" b="#D8875A" />
          </Defs>
          <Path d="M 50 60 L 50 42" stroke="#2A8C58" strokeWidth={3} strokeLinecap="round" />
          <Path d="M 48 58 C 30 56 18 44 16 26 C 34 26 46 38 48 58 Z" fill={g('l')} />
          <Path d="M 52 58 C 54 36 66 22 86 20 C 86 40 72 54 52 58 Z" fill={g('r')} />
          <Path d="M 46 55 C 36 49 27 40 22 31" {...HI} />
          <Path d="M 55 55 C 62 45 71 34 80 26" {...HI} />
          <Path d="M 28 60 L 72 60 L 66 90 L 34 90 Z" fill={g('p')} />
          <Rect x={24} y={54} width={52} height={10} rx={3} fill="#EDB48A" />
          <Path d="M 28 56.5 L 60 56.5" {...HI} />
          <Path d="M 34 68 L 37 86" {...HI} strokeOpacity={0.35} />
        </G>
      );
    case 'chair':
      return (
        <G>
          <Defs>
            <Grad id={`${u}c`} a="#5C9EF7" b="#2361D6" />
            <Grad id={`${u}s`} a="#7FB5F9" b="#3B82EE" />
          </Defs>
          <Rect x={24} y={70} width={6} height={18} rx={2} fill="#1C2A5E" />
          <Rect x={70} y={70} width={6} height={18} rx={2} fill="#1C2A5E" />
          <Rect x={24} y={16} width={52} height={46} rx={14} fill={g('c')} />
          <Rect x={16} y={48} width={68} height={24} rx={10} fill={g('s')} />
          <Rect x={12} y={38} width={14} height={30} rx={6} fill={g('c')} />
          <Rect x={74} y={38} width={14} height={30} rx={6} fill={g('c')} />
          <Path d="M 34 20 C 44 18 56 18 66 20" {...HI} />
          <Path d="M 24 52 L 74 52" {...HI} />
          <Path d="M 15 42 L 15 60" {...HI} strokeOpacity={0.4} />
        </G>
      );
    case 'poster':
      return (
        <G>
          <Defs>
            <Grad id={`${u}f`} a="#F9BE7E" b="#E58A3C" />
            <Grad id={`${u}s`} a="#E3F2FD" b="#B5DCF8" />
            <Grad id={`${u}h`} a="#8ED8AE" b="#4CB57E" />
          </Defs>
          <Rect x={16} y={14} width={68} height={72} rx={4} fill={g('f')} />
          <Rect x={22} y={20} width={56} height={60} rx={1.5} fill={g('s')} />
          <Circle cx={36} cy={34} r={7} fill="#FDC53A" />
          <Circle cx={34} cy={32} r={3} fill="#FFFFFF" opacity={0.45} />
          <Path d="M 22 64 C 34 50 46 52 56 62 C 62 56 70 54 78 60 L 78 80 L 22 80 Z" fill={g('h')} />
          <Path d="M 19 18 L 80 18" {...HI} />
          <Path d="M 18 22 L 18 82" {...HI} strokeOpacity={0.35} />
        </G>
      );
    case 'rug':
      return (
        <G>
          <Defs>
            <Grad id={`${u}o`} a="#FBE08A" b="#EFB43C" x2={0} />
            <Grad id={`${u}i`} a="#7DB4F8" b="#3F7FE8" x2={0} />
          </Defs>
          <Ellipse cx={50} cy={53} rx={44} ry={29} fill="#000000" opacity={0.08} />
          <Ellipse cx={50} cy={50} rx={44} ry={29} fill={g('o')} />
          <Ellipse cx={50} cy={50} rx={39.5} ry={25} fill="none" stroke="#FFF6D6" strokeWidth={1.4} strokeDasharray="3 3" />
          <Ellipse cx={50} cy={50} rx={33} ry={19.5} fill={g('i')} />
          <Ellipse cx={50} cy={50} rx={28.5} ry={15.5} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.2} strokeDasharray="3 3" />
          <Ellipse cx={50} cy={50} rx={14} ry={7} fill="#F7839C" />
          <Path d="M 26 38 C 34 30 50 28 62 29" {...HI} />
        </G>
      );
    case 'pet':
      return (
        <G>
          <Defs>
            <Grad id={`${u}b`} a="#F9D08A" b="#E09A45" />
            <Grad id={`${u}h`} a="#FBD795" b="#E8A24E" />
            <Grad id={`${u}e`} a="#B27447" b="#7A4A2A" />
          </Defs>
          {/* tail, body and paws */}
          <Path d="M 70 70 C 84 68 90 56 86 46" stroke={g('e')} strokeWidth={7} strokeLinecap="round" fill="none" />
          <Ellipse cx={50} cy={72} rx={24} ry={18} fill={g('b')} />
          <Ellipse cx={50} cy={76} rx={12} ry={10} fill="#FCEBCB" />
          <Ellipse cx={38} cy={88} rx={8} ry={5} fill="#E8A24E" />
          <Ellipse cx={62} cy={88} rx={8} ry={5} fill="#E8A24E" />
          {/* collar */}
          <Path d="M 34 56 C 42 62 58 62 66 56" stroke="#F7839C" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={50} cy={63} r={3.6} fill="#FDC53A" />
          {/* head */}
          <Circle cx={50} cy={38} r={22} fill={g('h')} />
          <Path d="M 30 26 C 20 26 14 40 20 52 C 26 50 30 40 32 32 Z" fill={g('e')} />
          <Path d="M 70 26 C 80 26 86 40 80 52 C 74 50 70 40 68 32 Z" fill={g('e')} />
          <Ellipse cx={50} cy={46} rx={11} ry={8} fill="#FCEBCB" />
          <Circle cx={41} cy={36} r={3.8} fill="#1B1414" />
          <Circle cx={59} cy={36} r={3.8} fill="#1B1414" />
          <Circle cx={42.2} cy={34.8} r={1.3} fill="#FFFFFF" />
          <Circle cx={60.2} cy={34.8} r={1.3} fill="#FFFFFF" />
          <Ellipse cx={50} cy={43} rx={3.6} ry={2.6} fill="#1B1414" />
          <Path d="M 46 48 Q 50 51.5 54 48" stroke="#1B1414" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Circle cx={36} cy={45} r={3} fill="#F7839C" opacity={0.45} />
          <Circle cx={64} cy={45} r={3} fill="#F7839C" opacity={0.45} />
          <Path d="M 38 20 C 44 17 52 17 58 19" {...HI} />
          <Path d="M 30 66 C 32 60 36 57 40 56" {...HI} strokeOpacity={0.4} />
        </G>
      );
    case 'books':
      return (
        <G>
          <Defs>
            {BOOKS.map((bk, i) => (
              <Grad key={i} id={`${u}b${i}`} a={bk.a} b={bk.b} x2={1} y2={0.3} />
            ))}
          </Defs>
          {BOOKS.map((bk, i) => {
            const h = 86 - bk.y;
            return (
              <G key={i} transform={bk.tilt ? `rotate(${bk.tilt} ${bk.x + bk.w / 2} ${bk.y + h / 2})` : undefined}>
                <Rect x={bk.x} y={bk.y} width={bk.w} height={h} rx={2} fill={g(`b${i}`)} />
                <Rect x={bk.x} y={bk.y + 8} width={bk.w} height={3} fill="#FFFFFF" opacity={0.45} />
                <Rect x={bk.x} y={bk.y + h - 11} width={bk.w} height={3} fill="#FFFFFF" opacity={0.45} />
                <Path d={`M ${bk.x + 2.5} ${bk.y + 14} L ${bk.x + 2.5} ${bk.y + h - 15}`} {...HI} strokeOpacity={0.45} />
              </G>
            );
          })}
        </G>
      );
    case 'lamp':
      return (
        <G>
          <Defs>
            <Grad id={`${u}s`} a="#FFE07A" b="#F2A91C" />
            <Grad id={`${u}p`} a="#9A6E55" b="#5E3F2E" x2={1} y2={0} />
          </Defs>
          <Rect x={47} y={46} width={6} height={36} rx={2} fill={g('p')} />
          <Path d="M 34 20 L 66 20 L 76 48 L 24 48 Z" fill={g('s')} />
          <Path d="M 36 24 L 30 44" {...HI} />
          <Path d="M 34 20.5 L 66 20.5" {...HI} strokeOpacity={0.4} />
          <Ellipse cx={50} cy={84} rx={20} ry={6} fill={g('p')} />
          <Path d="M 36 82 C 42 80 50 80 56 80.5" {...HI} strokeOpacity={0.4} />
        </G>
      );
    case 'kite':
      return (
        <G>
          <Defs>
            <Grad id={`${u}k`} a="#FF8C95" b="#E03A4B" x2={1} />
          </Defs>
          <Path d="M 50 70 C 44 78 56 82 50 90" stroke="#3F86F0" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M 46 78 L 54 74 L 54 80 Z M 45 86 L 54 84 L 50 90 Z" fill="#FDC53A" />
          <Path d="M 50 10 L 78 40 L 50 70 L 22 40 Z" fill={g('k')} />
          <Path d="M 50 10 L 78 40 L 50 40 Z" fill="#FFFFFF" opacity={0.18} />
          <Path d="M 50 10 L 50 70 M 22 40 L 78 40" stroke="#FFFFFF" strokeWidth={2} />
          <Path d="M 47 15 L 27 37" {...HI} />
        </G>
      );
  }
}

/** Where each item goes in the room (SVG transform of its 100×100 art box), back to front. */
export const ROOM_PLACEMENT: Record<RoomItemId, string> = {
  poster: 'translate(26 36) scale(0.9)',
  kite: 'translate(292 22) scale(0.8)',
  books: 'translate(284 108) scale(0.5)',
  rug: `translate(${RUG_CENTER.x - 50 * 2.1} ${RUG_CENTER.y - 50 * 0.9}) scale(2.1 0.9)`,
  lamp: 'translate(92 172) scale(1.1)',
  plant: 'translate(8 196) scale(1)',
  chair: 'translate(276 196) scale(1.08)',
  // Beside the rug rather than on it, so the buddy never hides the pet.
  pet: 'translate(282 290) scale(0.74)',
};
const ROOM_ORDER = Object.keys(ROOM_PLACEMENT) as RoomItemId[];

/** One placed item in room coordinates (ROOM_VB), e.g. for its own animated layer. */
export function RoomPlacedArt({ id }: { id: RoomItemId }) {
  return (
    <G>
      {id === 'books' ? (
        <>
          <Rect x={280} y={152} width={96} height={8} rx={2} fill="#D9A574" />
          <Path d="M 283 153.5 L 372 153.5" {...HI} strokeOpacity={0.4} />
        </>
      ) : null}
      <G transform={ROOM_PLACEMENT[id]}>
        <RoomItemArt id={id} />
      </G>
    </G>
  );
}

/**
 * Kid's room scene (Room tab) — viewBox ROOM_VB (390×380). Unlocked items
 * appear in place; the rug sits at RUG_CENTER, leaving room for the buddy.
 */
export function RoomSceneArt({ placed }: { placed: string[] }) {
  const u = useUid('room');
  const g = (n: string) => `url(#${u}${n})`;
  const has = (id: RoomItemId) => placed.includes(id);
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}w`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D5E6FB" />
          <Stop offset="1" stopColor="#EAF3FD" />
        </LinearGradient>
        <LinearGradient id={`${u}f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0C99D" />
          <Stop offset="1" stopColor="#F6D8B4" />
        </LinearGradient>
        <LinearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CFEAFD" />
          <Stop offset="1" stopColor="#A9D8FA" />
        </LinearGradient>
      </Defs>
      {/* wall */}
      <Rect x={0} y={0} width={390} height={250} fill={g('w')} />
      <G opacity={0.35}>
        {[40, 110, 180, 250, 320].map((x) => (
          <Circle key={x} cx={x} cy={200} r={2} fill="#FFFFFF" />
        ))}
      </G>
      {/* floor */}
      <Rect x={0} y={248} width={390} height={132} fill={g('f')} />
      <Path d="M 0 290 L 390 290 M 0 334 L 390 334" stroke="#E8BC8C" strokeWidth={2} opacity={0.7} />
      <Path d="M 96 250 L 90 290 M 262 290 L 270 334 M 150 334 L 146 380" stroke="#E8BC8C" strokeWidth={2} opacity={0.7} />
      <Rect x={0} y={242} width={390} height={10} fill="#FFFFFF" />
      <Rect x={0} y={250} width={390} height={3} fill="#E4B88C" />
      {/* window */}
      <Rect x={146} y={34} width={104} height={104} rx={8} fill="#FFFFFF" />
      <Rect x={154} y={42} width={88} height={88} rx={4} fill={g('s')} />
      <Circle cx={218} cy={64} r={10} fill="#FDC53A" />
      <Path d="M 154 112 C 178 98 206 100 242 114 L 242 130 L 154 130 Z" fill="#8CCB7A" />
      <Path d="M 198 42 L 198 130 M 154 86 L 242 86" stroke="#FFFFFF" strokeWidth={3.4} />
      <Rect x={140} y={136} width={116} height={9} rx={4} fill="#F2F7FE" />
      <Path d="M 150 38 L 246 38" {...HI} strokeOpacity={0.9} />
      {ROOM_ORDER.filter(has).map((id) => (
        <RoomPlacedArt key={id} id={id} />
      ))}
    </G>
  );
}

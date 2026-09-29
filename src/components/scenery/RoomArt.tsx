import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { RoomItemId } from '@/content/rewards';

/** Small item illustrations (reward tiles) — 100×100 art box. */
export function RoomItemArt({ id }: { id: RoomItemId }) {
  switch (id) {
    case 'plant':
      return (
        <G>
          <Path d="M 48 58 C 30 56 18 44 16 26 C 34 26 46 38 48 58 Z" fill="#3FAE72" />
          <Path d="M 52 58 C 54 36 66 22 86 20 C 86 40 72 54 52 58 Z" fill="#2E9E62" />
          <Path d="M 50 60 L 50 44" stroke="#2A8C58" strokeWidth={3} />
          <Path d="M 28 58 L 72 58 L 66 90 L 34 90 Z" fill="#E8A77A" />
          <Rect x={24} y={54} width={52} height={10} rx={3} fill="#EDB48A" />
        </G>
      );
    case 'chair':
      return (
        <G>
          <Rect x={24} y={16} width={52} height={46} rx={14} fill="#2F7BEA" />
          <Rect x={16} y={48} width={68} height={24} rx={10} fill="#4A92F2" />
          <Rect x={12} y={38} width={14} height={30} rx={6} fill="#2F7BEA" />
          <Rect x={74} y={38} width={14} height={30} rx={6} fill="#2F7BEA" />
          <Rect x={24} y={70} width={6} height={18} rx={2} fill="#1C2A5E" />
          <Rect x={70} y={70} width={6} height={18} rx={2} fill="#1C2A5E" />
        </G>
      );
    case 'poster':
      return (
        <G>
          <Rect x={16} y={14} width={68} height={72} rx={3} fill="#F2A65E" />
          <Rect x={22} y={20} width={56} height={60} fill="#CFE8FB" />
          <Circle cx={36} cy={34} r={7} fill="#FDC53A" />
          <Path d="M 22 64 C 34 50 46 52 56 62 C 62 56 70 54 78 60 L 78 80 L 22 80 Z" fill="#6CC596" />
        </G>
      );
    case 'rug':
      return (
        <G>
          <Rect x={10} y={22} width={80} height={56} rx={26} fill="#F7D774" />
          <Rect x={18} y={30} width={64} height={40} rx={20} fill="#5A9CF5" />
        </G>
      );
    case 'pet':
      return (
        <G>
          <Path d="M 22 30 L 30 10 L 42 26 Z M 78 30 L 70 10 L 58 26 Z" fill="#E9A955" />
          <Path d="M 70 22 C 84 26 88 44 82 60 L 70 50 Z" fill="#8A5634" />
          <Ellipse cx={50} cy={48} rx={32} ry={28} fill="#F2BE6C" />
          <Circle cx={40} cy={46} r={4} fill="#1B1414" />
          <Circle cx={60} cy={46} r={4} fill="#1B1414" />
          <Path d="M 46 56 Q 50 60 54 56" stroke="#1B1414" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Ellipse cx={50} cy={53} rx={3.4} ry={2.4} fill="#1B1414" />
          <Rect x={32} y={74} width={36} height={10} rx={5} fill="#F7839C" />
          <Ellipse cx={36} cy={84} rx={8} ry={5} fill="#3A2A2A" opacity={0.8} />
          <Ellipse cx={64} cy={84} rx={8} ry={5} fill="#3A2A2A" opacity={0.8} />
        </G>
      );
    case 'books':
      return (
        <G>
          <Rect x={14} y={40} width={12} height={46} rx={2} fill="#F7C23C" transform="rotate(-12 20 63)" />
          <Rect x={30} y={30} width={14} height={56} rx={2} fill="#F25F6F" />
          <Rect x={46} y={20} width={14} height={66} rx={2} fill="#7FD3C8" />
          <Rect x={62} y={28} width={14} height={58} rx={2} fill="#3F86F0" />
          <Rect x={78} y={36} width={10} height={50} rx={2} fill="#B690FA" />
        </G>
      );
    case 'lamp':
      return (
        <G>
          <Path d="M 34 20 L 66 20 L 76 48 L 24 48 Z" fill="#F7C23C" />
          <Rect x={47} y={48} width={6} height={32} fill="#6E4B3B" />
          <Ellipse cx={50} cy={84} rx={20} ry={6} fill="#6E4B3B" />
        </G>
      );
    case 'kite':
      return (
        <G>
          <Path d="M 50 10 L 78 40 L 50 70 L 22 40 Z" fill="#F25F6F" />
          <Path d="M 50 10 L 50 70 M 22 40 L 78 40" stroke="#FFFFFF" strokeWidth={2} />
          <Path d="M 50 70 C 44 78 56 82 50 90" stroke="#3F86F0" strokeWidth={2.4} fill="none" />
        </G>
      );
  }
}

/** Kid's room scene (Room tab) — viewBox 390×300. Unlocked items appear in place. */
export function RoomSceneArt({ placed }: { placed: string[] }) {
  const has = (id: RoomItemId) => placed.includes(id);
  return (
    <G>
      <Defs>
        <LinearGradient id="roomWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DCEBFC" />
          <Stop offset="1" stopColor="#EAF3FD" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={390} height={300} fill="url(#roomWall)" />
      <Rect x={0} y={200} width={390} height={100} fill="#F2CFA6" />
      <Path d="M 0 200 L 390 200" stroke="#E4B88C" strokeWidth={4} />
      <Rect x={150} y={30} width={96} height={86} rx={6} fill="#FFFFFF" />
      <Rect x={158} y={38} width={80} height={70} rx={3} fill="#BFE3FB" />
      <Circle cx={218} cy={58} r={9} fill="#FDC53A" />
      <Path d="M 158 96 C 180 84 204 86 238 98 L 238 108 L 158 108 Z" fill="#8CCB7A" />
      <Path d="M 198 38 L 198 108 M 158 72 L 238 72" stroke="#FFFFFF" strokeWidth={3} />
      {has('poster') && <G transform="translate(28 28) scale(0.9)"><RoomItemArt id="poster" /></G>}
      {has('kite') && <G transform="translate(290 20) scale(0.8)"><RoomItemArt id="kite" /></G>}
      {has('books') && (
        <G>
          <Rect x={280} y={132} width={96} height={8} rx={2} fill="#D9A574" />
          <G transform="translate(284 84) scale(0.5)"><RoomItemArt id="books" /></G>
        </G>
      )}
      {has('rug') && <G transform="translate(110 206) scale(1.7 0.9)"><RoomItemArt id="rug" /></G>}
      {has('plant') && <G transform="translate(14 150) scale(0.95)"><RoomItemArt id="plant" /></G>}
      {has('chair') && <G transform="translate(268 150) scale(1.05)"><RoomItemArt id="chair" /></G>}
      {has('lamp') && <G transform="translate(96 124) scale(0.85)"><RoomItemArt id="lamp" /></G>}
      {has('pet') && <G transform="translate(206 208) scale(0.7)"><RoomItemArt id="pet" /></G>}
    </G>
  );
}

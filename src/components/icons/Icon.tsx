/**
 * BrightPath icon set — original, soft-gradient vector icons matching the
 * locked art direction. Illustrated icons use a 48-unit grid; UI glyphs use 24.
 */
import { memo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useUid } from '@/lib/uid';

export type IconName =
  // illustrated
  | 'heart'
  | 'sprout'
  | 'star'
  | 'people'
  | 'mountain'
  | 'chat'
  | 'chatOrange'
  | 'chatBlue'
  | 'smile'
  | 'clock'
  | 'clockOutline'
  | 'hand'
  | 'card'
  | 'point'
  | 'question'
  | 'blocks'
  | 'highfive'
  | 'wave'
  | 'swing'
  | 'sun'
  | 'moon'
  | 'lock'
  | 'lockGreen'
  | 'bell'
  | 'shield'
  | 'doc'
  | 'trash'
  | 'bulb'
  | 'trophy'
  | 'paw'
  | 'palette'
  | 'soccer'
  | 'music'
  | 'tree'
  | 'book'
  | 'target'
  | 'arrowUp'
  | 'bars'
  | 'barsGreen'
  | 'calendar'
  | 'person'
  | 'personGreen'
  | 'personYellow'
  | 'personBlue'
  | 'phone'
  | 'house'
  | 'backpack'
  | 'group'
  | 'runner'
  | 'gear'
  | 'globe'
  | 'info'
  | 'accessibility'
  | 'camera'
  | 'mic'
  | 'tag'
  | 'faceTeal'
  | 'starCircle'
  | 'heartCircle'
  | 'calendarCircle'
  | 'chatCircle'
  | 'bagCircle'
  | 'shirt'
  | 'bowl'
  | 'check'
  // glyphs
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'plus'
  | 'close'
  | 'dots'
  | 'dotsV'
  | 'backspace'
  | 'tabHome'
  | 'tabStar'
  | 'tabLeaf'
  | 'tabBars'
  | 'tabPerson'
  | 'tabLearners'
  | 'tabGoals'
  | 'tabTools'
  | 'tabInsights'
  | 'speaker'
  | 'play'
  | 'pause'
  | 'edit'
  | 'download'
  | 'handHeart';

type Props = { name: IconName; size?: number; color?: string; opacity?: number };

const G48 = '0 0 48 48';
/** Icons never shrink inside flex rows (an <svg> on web otherwise would). */
const ICON_STYLE = { flexShrink: 0 } as const;
const G24 = '0 0 24 24';

function Grad({ id, a, b, x2 = 0.4, y2 = 1 }: { id: string; a: string; b: string; x2?: number; y2?: number }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <Stop offset="0" stopColor={a} />
      <Stop offset="1" stopColor={b} />
    </LinearGradient>
  );
}

const HEART = 'M 24 41 C 20 37.6 6 28.6 6 17.6 C 6 11.4 10.6 7 16.2 7 C 19.6 7 22.4 8.8 24 11.4 C 25.6 8.8 28.4 7 31.8 7 C 37.4 7 42 11.4 42 17.6 C 42 28.6 28 37.6 24 41 Z';
const STAR = 'M 24 4.8 C 25.2 4.8 26.1 5.5 26.6 6.6 L 30.9 15.4 L 40.5 16.8 C 43 17.2 44 20.2 42.2 21.9 L 35.2 28.7 L 36.9 38.3 C 37.3 40.8 34.7 42.6 32.5 41.4 L 24 36.9 L 15.5 41.4 C 13.3 42.6 10.7 40.8 11.1 38.3 L 12.8 28.7 L 5.8 21.9 C 4 20.2 5 17.2 7.5 16.8 L 17.1 15.4 L 21.4 6.6 C 21.9 5.5 22.8 4.8 24 4.8 Z';

export const Icon = memo(function Icon({ name, size = 32, color, opacity = 1 }: Props) {
  const u = useUid('ic');
  const g = (n: string) => `url(#${u}${n})`;
  const S = (vb: string, children: React.ReactNode, defs?: React.ReactNode) => (
    <Svg width={size} height={size} viewBox={vb} opacity={opacity} style={ICON_STYLE}>
      {defs && <Defs>{defs}</Defs>}
      {children}
    </Svg>
  );
  const c = color;

  switch (name) {
    case 'heart':
      return S(G48, <G><Path d={HEART} fill={g('h')} /><Ellipse cx={15} cy={15} rx={4.5} ry={3} fill="#FFFFFF" opacity={0.35} /></G>, <Grad id={`${u}h`} a="#FF8FA6" b="#F0507A" />);
    case 'sprout':
      return S(
        G48,
        <G>
          <Path d="M 24 44 L 24 24" stroke="#2A8C58" strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M 23.5 26 C 12 26.5 5 19 5.5 9.5 C 16 9 23.6 15.5 23.5 26 Z" fill={g('l')} />
          <Path d="M 24.5 24 C 24.5 12 31.5 5.5 43 5.5 C 43.4 17 36 24.5 24.5 24 Z" fill={g('r')} />
          <Path d="M 22 24 C 17 20 12 15.5 9 12" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.4} fill="none" />
          <Path d="M 26 22 C 31 17.5 36 12.5 40 8.5" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.4} fill="none" />
        </G>,
        <>
          <Grad id={`${u}l`} a="#5CC98A" b="#2E9E62" />
          <Grad id={`${u}r`} a="#4DBB7E" b="#23875A" />
        </>,
      );
    case 'star':
      return S(G48, <G><Path d={STAR} fill={g('s')} /><Path d="M 17 16.5 L 21.6 7.6" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2.2} strokeLinecap="round" /></G>, <Grad id={`${u}s`} a="#FFD457" b="#F6AC19" />);
    case 'people':
      return S(
        G48,
        <G>
          <Circle cx={32} cy={15} r={7} fill="#7AB2F7" />
          <Path d="M 21 40 C 21 30 25.5 25 32 25 C 38.5 25 43 30 43 40 Z" fill="#7AB2F7" />
          <Circle cx={18} cy={15.5} r={7.6} fill={g('p')} />
          <Path d="M 5 41 C 5 30.5 10.5 25.5 18 25.5 C 25.5 25.5 31 30.5 31 41 Z" fill={g('p')} />
        </G>,
        <Grad id={`${u}p`} a="#3F8AF6" b="#1F63DA" />,
      );
    case 'group':
      return S(
        G48,
        <G fill={c ?? '#2F74E8'}>
          <Circle cx={24} cy={13} r={6} />
          <Circle cx={11} cy={17} r={4.6} opacity={0.85} />
          <Circle cx={37} cy={17} r={4.6} opacity={0.85} />
          <Path d="M 14 40 C 14 29 18 23 24 23 C 30 23 34 29 34 40 Z" />
          <Path d="M 3 38 C 3 30 6 25.5 11 25.5 C 13 25.5 14.5 26.3 15.6 27.6 C 13.6 30.6 12.6 34.4 12.6 38 Z" opacity={0.85} />
          <Path d="M 45 38 C 45 30 42 25.5 37 25.5 C 35 25.5 33.5 26.3 32.4 27.6 C 34.4 30.6 35.4 34.4 35.4 38 Z" opacity={0.85} />
        </G>,
      );
    case 'mountain':
      return S(
        G48,
        <G>
          <Path d="M 3 42 L 16 24 L 24 32 Z" fill="#7FB2F6" />
          <Path d="M 10 42 L 28 13 L 45 42 Z" fill={g('m')} />
          <Path d="M 28 13 L 45 42 L 34 42 C 33 32 31 21 28 13 Z" fill="#1A4FB8" opacity={0.4} />
          <Path d="M 28 13 L 28 3" stroke="#3A4A8C" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M 28 3 L 38 6 L 28 9.4 Z" fill="#F0504E" />
        </G>,
        <Grad id={`${u}m`} a="#4C8EF4" b="#2459D0" x2={1} y2={1} />,
      );
    case 'chat':
    case 'chatOrange':
    case 'chatBlue': {
      const [a, b] = name === 'chatOrange' ? ['#FFA15E', '#F0702C'] : name === 'chatBlue' ? ['#4C92F6', '#2466DA'] : ['#4FC07E', '#2E9A5E'];
      return S(
        G48,
        <G>
          <Path d="M 24 6 C 35.6 6 44 13.4 44 22.6 C 44 31.8 35.6 39 24 39 C 21.6 39 19.4 38.7 17.4 38.1 L 9 43 L 10.6 34.4 C 6.4 31.4 4 27.2 4 22.6 C 4 13.4 12.4 6 24 6 Z" fill={g('c')} />
          <Circle cx={15.5} cy={22.6} r={3} fill="#FFFFFF" />
          <Circle cx={24} cy={22.6} r={3} fill="#FFFFFF" />
          <Circle cx={32.5} cy={22.6} r={3} fill="#FFFFFF" />
        </G>,
        <Grad id={`${u}c`} a={a} b={b} />,
      );
    }
    case 'smile':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={19} fill={g('f')} />
          <Circle cx={17.5} cy={20} r={2.4} fill="#1D3B8A" />
          <Circle cx={30.5} cy={20} r={2.4} fill="#1D3B8A" />
          <Path d="M 15.5 27.5 Q 24 35 32.5 27.5" stroke="#1D3B8A" strokeWidth={2.8} strokeLinecap="round" fill="none" />
        </G>,
        <Grad id={`${u}f`} a="#7EC0FB" b="#3D8EF2" />,
      );
    case 'faceTeal':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={20} fill={c ?? '#2FB59A'} />
          <Circle cx={17.5} cy={21} r={2.4} fill="#FFFFFF" />
          <Circle cx={30.5} cy={21} r={2.4} fill="#FFFFFF" />
          <Path d="M 15.5 28 Q 24 35 32.5 28" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>,
      );
    case 'clock':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={19} fill={g('k')} />
          <Path d="M 24 13 L 24 25 L 31 30" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>,
        <Grad id={`${u}k`} a="#C4A6FB" b="#8E63EE" />,
      );
    case 'clockOutline':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={17} stroke={c ?? '#8E63EE'} strokeWidth={4} fill="none" />
          <Path d="M 24 14 L 24 25 L 30.5 29" stroke={c ?? '#8E63EE'} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>,
      );
    case 'hand':
      return S(
        G48,
        <G>
          <Path d="M 14 26 L 14 13 C 14 11 17.5 11 17.5 13 L 17.5 22 L 17.5 9.5 C 17.5 7.5 21 7.5 21 9.5 L 21 21 L 21 8 C 21 6 24.5 6 24.5 8 L 24.5 21 L 24.5 10 C 24.5 8 28 8 28 10 L 28 26 L 31 21.5 C 32.4 19.6 35.4 21 34.4 23.2 L 29.5 33.5 C 27.8 37.4 24.6 40 20.4 40 C 16.4 40 14 36.6 14 32.6 Z" fill={g('h')} />
          <Path d="M 21 31 C 21 29 24 29 24 31 C 24 29 27 29 27 31 C 27 33 24 35 24 35 C 24 35 21 33 21 31 Z" fill="#FFFFFF" opacity={0.85} />
        </G>,
        <Grad id={`${u}h`} a="#FFB38A" b="#F28A5B" />,
      );
    case 'handHeart':
      return S(
        G24,
        <G>
          <Path d="M 7 13 L 7 6.5 C 7 5.5 8.8 5.5 8.8 6.5 L 8.8 11 L 8.8 4.8 C 8.8 3.8 10.5 3.8 10.5 4.8 L 10.5 10.5 L 10.5 4 C 10.5 3 12.2 3 12.2 4 L 12.2 10.5 L 12.2 5 C 12.2 4 14 4 14 5 L 14 13 L 15.5 10.8 C 16.2 9.8 17.7 10.5 17.2 11.6 L 14.7 16.8 C 13.9 18.7 12.3 20 10.2 20 C 8.2 20 7 18.3 7 16.3 Z" fill={c ?? '#FFFFFF'} />
        </G>,
      );
    case 'card':
      return S(
        G48,
        <G>
          <Rect x={7} y={9} width={34} height={30} rx={6} fill={g('d')} />
          <Rect x={11} y={13} width={26} height={16} rx={3} fill="#FFFFFF" opacity={0.9} />
          <Path d="M 20 25 L 20 19 C 20 18 21.4 18 21.4 19 L 21.4 22 L 21.4 17.6 C 21.4 16.6 22.8 16.6 22.8 17.6 L 22.8 22 L 22.8 18.2 C 22.8 17.2 24.2 17.2 24.2 18.2 L 24.2 22 L 24.2 19 C 24.2 18 25.6 18 25.6 19 L 25.6 25 C 25.6 27 24 28 22.8 28 C 21.4 28 20 27 20 25 Z" fill="#3D86F0" />
          <Rect x={13} y={32} width={22} height={3} rx={1.5} fill="#FFFFFF" opacity={0.8} />
        </G>,
        <Grad id={`${u}d`} a="#7EB9FA" b="#3D86F0" />,
      );
    case 'point':
      return S(
        G48,
        <G>
          <Path d="M 12 30 L 12 23 C 12 21 15 21 15 23 L 15 25 L 15 12 C 15 9.4 19 9.4 19 12 L 19 22 L 30 22 C 33.5 22 36 24.5 36 28 L 36 32 C 36 37 32 41 27 41 L 21 41 C 16 41 12 36.5 12 30 Z" fill={g('p')} />
          <Circle cx={36} cy={10} r={4} fill="#FDC53A" />
        </G>,
        <Grad id={`${u}p`} a="#C6A8FB" b="#8E63EE" />,
      );
    case 'question':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={19} fill={c ?? g('q')} />
          <Path d="M 18.5 18.5 C 18.5 15 21 12.8 24.2 12.8 C 27.6 12.8 30 15 30 18 C 30 22.4 24.4 22.6 24.4 27.4" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" fill="none" />
          <Circle cx={24.4} cy={33.6} r={2.4} fill="#FFFFFF" />
        </G>,
        <Grad id={`${u}q`} a="#8C9AE2" b="#5A6BC8" />,
      );
    case 'info':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={19} fill={c ?? '#6C7BD0'} />
          <Circle cx={24} cy={15} r={2.8} fill="#FFFFFF" />
          <Path d="M 24 21.5 L 24 34" stroke="#FFFFFF" strokeWidth={4.4} strokeLinecap="round" />
        </G>,
      );
    case 'blocks':
      return S(
        G48,
        <G>
          <Rect x={6} y={26} width={14} height={14} rx={2.5} fill="#3D86F0" />
          <Rect x={21} y={26} width={14} height={14} rx={2.5} fill="#4CC478" />
          <Rect x={13} y={12} width={14} height={14} rx={2.5} fill="#F7B23B" />
          <Rect x={28} y={7} width={11} height={11} rx={2.5} fill="#F25F6F" />
        </G>,
      );
    case 'highfive':
      return S(
        G48,
        <G>
          <Path d="M 16 36 L 12 20 C 11.5 18 14.5 17 15.2 19 L 17.5 26 L 14.5 12 C 14 10 17 9.2 17.7 11.2 L 21 23 L 19.8 9.6 C 19.6 7.6 22.8 7.4 23 9.4 L 24.6 22.6 L 25.4 12.4 C 25.6 10.4 28.6 10.6 28.4 12.6 L 27.6 27 C 27.4 33 23.4 38 19.4 38 Z" fill="#7EB9FA" />
          <Path d="M 34 8 L 36 4 M 38.5 12 L 43 10 M 38 17 L 42.5 18.5" stroke="#FDC53A" strokeWidth={2.6} strokeLinecap="round" />
        </G>,
      );
    case 'wave':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={19} fill="#C8B2FA" />
          <Circle cx={18} cy={21} r={2.2} fill="#3A2A7A" />
          <Circle cx={30} cy={21} r={2.2} fill="#3A2A7A" />
          <Path d="M 17 28 Q 24 34 31 28" stroke="#3A2A7A" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>,
      );
    case 'swing':
      return S(
        G48,
        <G>
          <Path d="M 8 42 L 16 6 L 32 6 L 40 42" stroke="#2E9C7A" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M 21 6 L 21 30 M 29 6 L 29 30" stroke="#6E4B3B" strokeWidth={2} />
          <Rect x={18} y={29} width={14} height={4} rx={2} fill="#F7B23B" />
        </G>,
      );
    case 'sun':
      return S(
        G48,
        <G>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <Line key={i} x1={24 + Math.cos(a) * 14.5} y1={24 + Math.sin(a) * 14.5} x2={24 + Math.cos(a) * 20} y2={24 + Math.sin(a) * 20} stroke="#FDC03A" strokeWidth={3.4} strokeLinecap="round" />;
          })}
          <Circle cx={24} cy={24} r={10.5} fill={g('s')} />
        </G>,
        <Grad id={`${u}s`} a="#FFD45C" b="#F7AE1E" />,
      );
    case 'moon':
      return S(G48, <Path d="M 30 5 C 20 7 13 15.5 13 25.5 C 13 36.8 22.2 45 33.6 43.6 C 27.8 40.2 24 34 24 26.8 C 24 17.6 29.6 9.2 38.4 6.6 C 35.8 5.4 32.8 4.8 30 5 Z" fill={g('m')} />, <Grad id={`${u}m`} a="#A58CF4" b="#6E55E0" />);
    case 'lock':
    case 'lockGreen': {
      const [a, b] = name === 'lockGreen' ? ['#4FC07E', '#2A8C58'] : ['#4C92F6', '#1F5FD6'];
      return S(
        G48,
        <G>
          <Path d="M 14 21 L 14 15 C 14 9 18.5 5 24 5 C 29.5 5 34 9 34 15 L 34 21" stroke={a} strokeWidth={4.6} fill="none" />
          <Rect x={8} y={19} width={32} height={25} rx={6} fill={g('l')} />
          <Circle cx={24} cy={29.5} r={3.6} fill="#FFFFFF" />
          <Path d="M 22.3 30 L 21.6 37 L 26.4 37 L 25.7 30 Z" fill="#FFFFFF" />
        </G>,
        <Grad id={`${u}l`} a={a} b={b} />,
      );
    }
    case 'bell':
      return S(
        G48,
        <G>
          <Path d="M 24 5 C 25.4 5 26.4 6 26.4 7.4 L 26.4 8.2 C 32.4 9.4 36 14.2 36 20.6 L 36 29 L 40 34.4 C 40.8 35.6 40 37 38.6 37 L 9.4 37 C 8 37 7.2 35.6 8 34.4 L 12 29 L 12 20.6 C 12 14.2 15.6 9.4 21.6 8.2 L 21.6 7.4 C 21.6 6 22.6 5 24 5 Z" fill={g('b')} />
          <Path d="M 19 39.5 C 19.8 42 21.6 43.4 24 43.4 C 26.4 43.4 28.2 42 29 39.5 Z" fill={g('b')} />
        </G>,
        <Grad id={`${u}b`} a="#4A6BF2" b="#2437D0" />,
      );
    case 'shield':
      return S(
        G48,
        <G>
          <Path d="M 24 4 L 40 10 L 40 22 C 40 32.4 33.4 40.4 24 44 C 14.6 40.4 8 32.4 8 22 L 8 10 Z" fill={g('s')} />
          <Path d="M 16.5 24 L 22 29.5 L 32 18.5" stroke="#FFFFFF" strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>,
        <Grad id={`${u}s`} a="#4C92F6" b="#1F5FD6" />,
      );
    case 'doc':
      return S(
        G48,
        <G>
          <Path d="M 12 4 L 29 4 L 38 13 L 38 42 C 38 43.2 37.2 44 36 44 L 12 44 C 10.8 44 10 43.2 10 42 L 10 6 C 10 4.8 10.8 4 12 4 Z" fill={g('d')} />
          <Path d="M 29 4 L 29 11 C 29 12.2 29.8 13 31 13 L 38 13 Z" fill="#9CC4FB" />
          <Path d="M 16 22 L 32 22 M 16 28 L 32 28 M 16 34 L 26 34" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </G>,
        <Grad id={`${u}d`} a="#4C92F6" b="#1F5FD6" />,
      );
    case 'trash':
      return S(
        G48,
        <G>
          <Rect x={9} y={9} width={30} height={5} rx={2.5} fill="#F26C8A" />
          <Rect x={19} y={4.5} width={10} height={6} rx={2} fill="#F26C8A" />
          <Path d="M 12 16 L 36 16 L 33.8 41 C 33.6 42.8 32.3 44 30.6 44 L 17.4 44 C 15.7 44 14.4 42.8 14.2 41 Z" fill={g('t')} />
          <Path d="M 19.5 22 L 20 37 M 24 22 L 24 37 M 28.5 22 L 28 37" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
        </G>,
        <Grad id={`${u}t`} a="#FF8AA2" b="#EC4F74" />,
      );
    case 'bulb':
      return S(
        G48,
        <G>
          <Path d="M 24 4 C 32.6 4 39 10.4 39 18.6 C 39 24.4 35.6 28 32.8 31 C 31.4 32.6 30.6 34.4 30.6 36.4 L 17.4 36.4 C 17.4 34.4 16.6 32.6 15.2 31 C 12.4 28 9 24.4 9 18.6 C 9 10.4 15.4 4 24 4 Z" fill={g('b')} />
          <Rect x={17.4} y={37.6} width={13.2} height={3.6} rx={1.6} fill="#F4A21E" />
          <Rect x={19.4} y={41.6} width={9.2} height={3.2} rx={1.6} fill="#E08F12" />
          <Ellipse cx={18.6} cy={14} rx={3.4} ry={5} fill="#FFFFFF" opacity={0.45} />
        </G>,
        <Grad id={`${u}b`} a="#FFD868" b="#F7B023" />,
      );
    case 'trophy':
      return S(
        G48,
        <G>
          <Path d="M 12 8 L 6 8 C 6 16 8.6 21 14 22 M 36 8 L 42 8 C 42 16 39.4 21 34 22" stroke="#F4A51C" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          <Path d="M 12 5 L 36 5 L 35 18 C 34.4 25.6 29.8 30.4 24 30.4 C 18.2 30.4 13.6 25.6 13 18 Z" fill={g('t')} />
          <Rect x={21} y={30} width={6} height={7} fill="#F4A51C" />
          <Rect x={14} y={37} width={20} height={6} rx={2} fill="#F4A51C" />
        </G>,
        <Grad id={`${u}t`} a="#FFD457" b="#F6AC19" />,
      );
    case 'paw':
      return S(
        G48,
        <G fill={g('p')}>
          <Ellipse cx={11} cy={21} rx={4.6} ry={6} />
          <Ellipse cx={19.2} cy={12.4} rx={4.6} ry={6.2} />
          <Ellipse cx={28.8} cy={12.4} rx={4.6} ry={6.2} />
          <Ellipse cx={37} cy={21} rx={4.6} ry={6} />
          <Path d="M 24 22 C 31 22 37 29 37 35 C 37 40 33 42 29.6 42 C 27.4 42 26 41 24 41 C 22 41 20.6 42 18.4 42 C 15 42 11 40 11 35 C 11 29 17 22 24 22 Z" />
        </G>,
        <Grad id={`${u}p`} a="#5CC98A" b="#2E9E62" />,
      );
    case 'palette':
      return S(
        G48,
        <G>
          <Path d="M 24 5 C 35 5 44 12.6 44 22.6 C 44 29 39.4 32 34.6 31 C 31 30.2 28.6 32.2 29.4 35.6 C 30.4 40 27.6 43.4 23 43 C 12.6 42 4 34 4 23.6 C 4 13 13 5 24 5 Z" fill={g('p')} />
          <Circle cx={15} cy={17} r={3.8} fill="#B26BF0" />
          <Circle cx={25} cy={12.4} r={3.8} fill="#F4608A" />
          <Circle cx={34.8} cy={17.6} r={3.8} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={13.4} cy={27.6} r={3.8} fill="#3D86F0" />
          <Circle cx={21} cy={34} r={3.4} fill="#2E9E62" />
        </G>,
        <Grad id={`${u}p`} a="#FFD06A" b="#F2A93A" />,
      );
    case 'soccer':
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={19} fill="#FFFFFF" stroke="#1C2860" strokeWidth={2} />
          <Path d="M 24 16 L 31 21 L 28.4 29.4 L 19.6 29.4 L 17 21 Z" fill="#1C2860" />
          <Path d="M 24 5.6 L 24 9.6 L 19 12.8 L 14 10.4 C 16.8 7.6 20.2 6 24 5.6 Z M 36.4 10.4 L 34 13 L 34.6 18 L 39.6 20.4 L 42.2 17.8 C 41.2 14.8 39.2 12.2 36.4 10.4 Z M 5.8 17.8 L 8.4 20.4 L 13.4 18 L 14 13 L 11.6 10.4 C 8.8 12.2 6.8 14.8 5.8 17.8 Z M 14 38 L 14.6 34.2 L 19.6 32.4 L 22 35.6 L 20.6 42.4 C 18.2 41.6 15.8 40.2 14 38 Z M 34 38 L 33.4 34.2 L 28.4 32.4 L 26 35.6 L 27.4 42.4 C 29.8 41.6 32.2 40.2 34 38 Z" fill="#1C2860" />
        </G>,
      );
    case 'music':
      return S(
        G48,
        <G>
          <Path d="M 18 34 L 18 11 L 40 6 L 40 29" stroke={g('m')} strokeWidth={5} strokeLinejoin="round" fill="none" />
          <Ellipse cx={12.6} cy={35.4} rx={7} ry={5.8} fill={g('m')} />
          <Ellipse cx={34.6} cy={30.4} rx={7} ry={5.8} fill={g('m')} />
        </G>,
        <Grad id={`${u}m`} a="#C28CF8" b="#8E55EE" x2={1} y2={1} />,
      );
    case 'tree':
      return S(
        G48,
        <G>
          <Path d="M 24 44 L 24 30" stroke="#7A4A2E" strokeWidth={4} strokeLinecap="round" />
          <Path d="M 24 3 L 36 18 L 31 18 L 39 30 L 9 30 L 17 18 L 12 18 Z" fill={g('t')} />
        </G>,
        <Grad id={`${u}t`} a="#5CC98A" b="#2E9E62" />,
      );
    case 'book':
      return S(
        G48,
        <G>
          <Path d="M 24 12 C 19 8 11 7 4 8.6 L 4 38 C 11 36.4 19 37.4 24 41.4 Z" fill={g('b')} />
          <Path d="M 24 12 C 29 8 37 7 44 8.6 L 44 38 C 37 36.4 29 37.4 24 41.4 Z" fill={g('c')} />
          <Path d="M 24 12 L 24 41.4" stroke="#1A4FB8" strokeWidth={1.6} />
        </G>,
        <>
          <Grad id={`${u}b`} a="#3F85F2" b="#1F5FD6" />
          <Grad id={`${u}c`} a="#5B9CF6" b="#2A6BE0" />
        </>,
      );
    case 'target':
      return S(
        G48,
        <G>
          <Circle cx={22} cy={26} r={17} stroke={c ?? '#2F6FE0'} strokeWidth={4} fill="none" />
          <Circle cx={22} cy={26} r={10} stroke={c ?? '#2F6FE0'} strokeWidth={4} fill="none" />
          <Circle cx={22} cy={26} r={3.6} fill={c ?? '#2F6FE0'} />
          <Path d="M 22 26 L 40 8" stroke={c ?? '#2F6FE0'} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M 35 6 L 41 4 L 42 10 Z" fill={c ?? '#2F6FE0'} />
        </G>,
      );
    case 'arrowUp':
      return S(G48, <Path d="M 24 5 L 42 24 L 31 24 L 31 43 L 17 43 L 17 24 L 6 24 Z" fill={g('a')} />, <Grad id={`${u}a`} a="#5CC98A" b="#2A8C58" />);
    case 'bars':
    case 'barsGreen':
      return S(
        G48,
        <G>
          <Rect x={5} y={25} width={10} height={18} rx={3} fill={name === 'barsGreen' ? '#4CC478' : '#3F8AF6'} />
          <Rect x={19} y={15} width={10} height={28} rx={3} fill="#5C9DF6" />
          <Rect x={33} y={5} width={10} height={38} rx={3} fill={name === 'barsGreen' ? '#3F8AF6' : '#4CC478'} opacity={name === 'barsGreen' ? 0.85 : 1} />
        </G>,
      );
    case 'calendar':
      return S(
        G48,
        <G>
          <Rect x={6} y={9} width={36} height={33} rx={7} fill={g('c')} />
          <Rect x={13} y={4} width={4} height={9} rx={2} fill="#7040D8" />
          <Rect x={31} y={4} width={4} height={9} rx={2} fill="#7040D8" />
          <Rect x={12} y={19} width={24} height={17} rx={3} fill="#FFFFFF" opacity={0.92} />
          <Path d="M 16 24 L 22 24 M 26 24 L 32 24 M 16 30 L 22 30 M 26 30 L 30 30" stroke="#9A6BF0" strokeWidth={2.6} strokeLinecap="round" />
        </G>,
        <Grad id={`${u}c`} a="#B98CF8" b="#8E55EE" />,
      );
    case 'person':
    case 'personGreen':
    case 'personYellow':
    case 'personBlue': {
      const col = c ?? (name === 'personGreen' ? '#2F9E5E' : name === 'personYellow' ? '#F5A623' : name === 'personBlue' ? '#2F74E8' : '#5B6AC8');
      return S(
        G48,
        <G fill={col}>
          <Circle cx={24} cy={15} r={8.6} />
          <Path d="M 8 43 C 8 32 14.6 26.6 24 26.6 C 33.4 26.6 40 32 40 43 Z" />
        </G>,
      );
    }
    case 'phone':
      return S(
        G48,
        <G transform="rotate(-14 24 24)">
          <Rect x={12} y={4} width={24} height={40} rx={5} fill="#23355F" />
          <Rect x={15} y={9} width={18} height={28} rx={2} fill="#8CC0FA" />
          <Rect x={18} y={16} width={12} height={9} rx={2} fill="#FFFFFF" opacity={0.8} />
          <Circle cx={24} cy={40.5} r={1.6} fill="#8CC0FA" />
        </G>,
      );
    case 'house':
      return S(
        G48,
        <G>
          <Path d="M 6 22 L 24 6 L 42 22" stroke={c ?? '#2F6FE0'} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M 11 21 L 24 9.6 L 37 21 L 37 41 C 37 42 36 43 35 43 L 13 43 C 12 43 11 42 11 41 Z" fill={c ?? '#2F6FE0'} />
          <Rect x={20} y={29} width={8} height={14} rx={1.6} fill="#FFFFFF" />
        </G>,
      );
    case 'backpack':
      return S(
        G48,
        <G>
          <Path d="M 18 8 C 18 4 30 4 30 8" stroke={c ?? '#2F6FE0'} strokeWidth={3} fill="none" />
          <Rect x={9} y={9} width={30} height={35} rx={9} fill={c ?? '#2F6FE0'} />
          <Rect x={15} y={24} width={18} height={13} rx={3.5} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={19} cy={17} r={2.2} fill="#FFFFFF" />
          <Circle cx={29} cy={17} r={2.2} fill="#FFFFFF" />
          <Path d="M 20 30 L 28 30" stroke={c ?? '#2F6FE0'} strokeWidth={2.4} strokeLinecap="round" />
        </G>,
      );
    case 'runner':
      return S(
        G24,
        <G fill={c ?? '#2F74E8'}>
          <Circle cx={14.5} cy={4} r={2.2} />
          <Path d="M 11.6 7.2 C 12.5 6.6 13.7 6.7 14.4 7.5 L 16.2 9.6 L 18.8 10.4 C 19.6 10.6 19.4 11.8 18.6 11.7 L 15.4 11.2 L 14 9.8 L 12.8 13.2 L 15.6 15.4 L 16.4 20 C 16.6 21 15.2 21.3 14.9 20.3 L 13.8 16.6 L 10.6 14.6 L 9.6 17.6 L 6 19 C 5.1 19.3 4.6 18 5.5 17.6 L 8.4 16.3 L 10.4 10.2 L 8.6 11.2 L 7.6 13.6 C 7.2 14.4 6 13.9 6.4 13 L 7.6 10.2 Z" />
        </G>,
      );
    case 'gear':
      return S(
        G24,
        <G>
          <Path
            d="M 10.3 2 L 13.7 2 L 14.3 4.6 C 15 4.9 15.6 5.2 16.2 5.7 L 18.7 4.8 L 20.4 7.7 L 18.4 9.4 C 18.5 10.1 18.5 10.9 18.4 11.6 L 20.4 13.3 L 18.7 16.2 L 16.2 15.3 C 15.6 15.8 15 16.1 14.3 16.4 L 13.7 19 L 10.3 19 L 9.7 16.4 C 9 16.1 8.4 15.8 7.8 15.3 L 5.3 16.2 L 3.6 13.3 L 5.6 11.6 C 5.5 10.9 5.5 10.1 5.6 9.4 L 3.6 7.7 L 5.3 4.8 L 7.8 5.7 C 8.4 5.2 9 4.9 9.7 4.6 Z"
            fill={c ?? '#2F6FE0'}
            transform="translate(0 1.5)"
          />
          <Circle cx={12} cy={12} r={3.2} fill="#FFFFFF" />
        </G>,
      );
    case 'globe':
      return S(
        G24,
        <G stroke={c ?? '#2F6FE0'} strokeWidth={2} fill="none">
          <Circle cx={12} cy={12} r={9.2} />
          <Path d="M 2.8 12 L 21.2 12 M 12 2.8 C 15 5.8 15.8 9 15.8 12 C 15.8 15 15 18.2 12 21.2 C 9 18.2 8.2 15 8.2 12 C 8.2 9 9 5.8 12 2.8 Z" />
        </G>,
      );
    case 'accessibility':
      return S(
        G24,
        <G fill={c ?? '#2F74E8'}>
          <Circle cx={12} cy={4} r={2.4} />
          <Path d="M 4.2 7.6 C 3.4 7.4 3.1 8.8 3.9 9 L 9.4 10.4 L 9.4 13.6 L 7.4 20.6 C 7.1 21.6 8.6 22 8.9 21 L 11.3 14.8 L 12.7 14.8 L 15.1 21 C 15.4 22 16.9 21.6 16.6 20.6 L 14.6 13.6 L 14.6 10.4 L 20.1 9 C 20.9 8.8 20.6 7.4 19.8 7.6 C 17.4 8.2 14.8 8.6 12 8.6 C 9.2 8.6 6.6 8.2 4.2 7.6 Z" />
        </G>,
      );
    case 'camera':
      return S(
        G24,
        <G>
          <Path d="M 8.6 4.6 L 15.4 4.6 L 16.8 7 L 20 7 C 21.1 7 22 7.9 22 9 L 22 18 C 22 19.1 21.1 20 20 20 L 4 20 C 2.9 20 2 19.1 2 18 L 2 9 C 2 7.9 2.9 7 4 7 L 7.2 7 Z" fill={c ?? '#2F74E8'} />
          <Circle cx={12} cy={13.2} r={4} fill="#FFFFFF" />
          <Circle cx={12} cy={13.2} r={2.2} fill={c ?? '#2F74E8'} />
        </G>,
      );
    case 'mic':
      return S(
        G24,
        <G>
          <Rect x={8.6} y={2} width={6.8} height={12} rx={3.4} fill={c ?? '#2F74E8'} />
          <Path d="M 5.4 11 C 5.4 14.8 8.4 17.6 12 17.6 C 15.6 17.6 18.6 14.8 18.6 11" stroke={c ?? '#2F74E8'} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M 12 17.6 L 12 21.4 M 8.6 21.6 L 15.4 21.6" stroke={c ?? '#2F74E8'} strokeWidth={2} strokeLinecap="round" />
        </G>,
      );
    case 'tag':
      return S(
        G24,
        <G>
          <Path d="M 3 4.6 C 3 3.7 3.7 3 4.6 3 L 11.6 3 C 12 3 12.4 3.2 12.7 3.5 L 20.7 11.5 C 21.3 12.1 21.3 13.1 20.7 13.7 L 13.7 20.7 C 13.1 21.3 12.1 21.3 11.5 20.7 L 3.5 12.7 C 3.2 12.4 3 12 3 11.6 Z" fill={c ?? '#2F74E8'} />
          <Circle cx={7.6} cy={7.6} r={1.8} fill="#FFFFFF" />
        </G>,
      );
    case 'starCircle':
    case 'heartCircle':
    case 'calendarCircle':
    case 'chatCircle':
    case 'bagCircle': {
      const bg = name === 'starCircle' ? '#F7B731' : name === 'heartCircle' ? '#F2557A' : name === 'calendarCircle' ? '#9A6BF0' : name === 'chatCircle' ? '#F4793A' : '#2F74E8';
      return S(
        G48,
        <G>
          <Circle cx={24} cy={24} r={21} fill={bg} />
          {name === 'starCircle' && <Path d={STAR} fill="#FFFFFF" transform="translate(9.6 9.8) scale(0.6)" />}
          {name === 'heartCircle' && <Path d={HEART} fill="#FFFFFF" transform="translate(10.2 10.6) scale(0.575)" />}
          {name === 'chatCircle' && (
            <G fill="#FFFFFF">
              <Circle cx={16} cy={24} r={2.8} />
              <Circle cx={24} cy={24} r={2.8} />
              <Circle cx={32} cy={24} r={2.8} />
            </G>
          )}
          {name === 'calendarCircle' && (
            <G>
              <Rect x={14} y={15} width={20} height={19} rx={3.5} fill="#FFFFFF" />
              <Rect x={17} y={11.6} width={3} height={6} rx={1.4} fill="#FFFFFF" />
              <Rect x={28} y={11.6} width={3} height={6} rx={1.4} fill="#FFFFFF" />
              <Path d="M 18 23 L 22 23 M 26 23 L 30 23 M 18 28 L 22 28" stroke={bg} strokeWidth={2.2} strokeLinecap="round" />
            </G>
          )}
          {name === 'bagCircle' && <Rect x={16} y={16} width={16} height={17} rx={4} fill="#FFFFFF" />}
        </G>,
      );
    }
    case 'shirt':
      return S(
        G48,
        <G>
          <Path d="M 16 6 L 8 10 L 3 20 L 10 24 L 12 20 L 12 42 L 36 42 L 36 20 L 38 24 L 45 20 L 40 10 L 32 6 C 30.6 9.4 27.6 11.4 24 11.4 C 20.4 11.4 17.4 9.4 16 6 Z" fill={g('s')} />
          <Path d="M 16 6 C 17.4 9.4 20.4 11.4 24 11.4 C 27.6 11.4 30.6 9.4 32 6" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} fill="none" />
        </G>,
        <Grad id={`${u}s`} a="#63A6F8" b="#2E6EE0" />,
      );
    case 'bowl':
      return S(
        G48,
        <G>
          <Ellipse cx={24} cy={20} rx={19} ry={5} fill="#F7E4B8" />
          <Circle cx={17} cy={18.5} r={2.6} fill="#F7B23B" />
          <Circle cx={24} cy={17.4} r={2.6} fill="#F25F6F" />
          <Circle cx={30.6} cy={18.6} r={2.6} fill="#F7B23B" />
          <Path d="M 5 20 C 5 32 13.6 40 24 40 C 34.4 40 43 32 43 20 Z" fill={g('b')} />
        </G>,
        <Grad id={`${u}b`} a="#FF9AAE" b="#EF5C80" />,
      );
    case 'check':
      return S(G24, <Path d="M 5 12.5 L 10 17.5 L 19 7" stroke={c ?? '#FFFFFF'} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />);

    /* ------------------------------------------------------- UI glyphs */
    case 'chevronLeft':
      return S(G24, <Path d="M 15 4.5 L 7.5 12 L 15 19.5" stroke={c ?? '#0B1494'} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
    case 'chevronRight':
      return S(G24, <Path d="M 9 4.5 L 16.5 12 L 9 19.5" stroke={c ?? '#1E2A9E'} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
    case 'chevronDown':
      return S(G24, <Path d="M 5 9 L 12 16 L 19 9" stroke={c ?? '#1E2A9E'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
    case 'plus':
      return S(G24, <Path d="M 12 4.5 L 12 19.5 M 4.5 12 L 19.5 12" stroke={c ?? '#1E2A9E'} strokeWidth={2.6} strokeLinecap="round" />);
    case 'close':
      return S(G24, <Path d="M 6 6 L 18 18 M 18 6 L 6 18" stroke={c ?? '#1E2A9E'} strokeWidth={2.6} strokeLinecap="round" />);
    case 'dots':
      return S(G24, <G fill={c ?? '#0B1494'}><Circle cx={5} cy={12} r={2.2} /><Circle cx={12} cy={12} r={2.2} /><Circle cx={19} cy={12} r={2.2} /></G>);
    case 'dotsV':
      return S(G24, <G fill={c ?? '#0B1494'}><Circle cx={12} cy={5} r={2.2} /><Circle cx={12} cy={12} r={2.2} /><Circle cx={12} cy={19} r={2.2} /></G>);
    case 'backspace':
      return S(
        G24,
        <G stroke={c ?? '#1E2A9E'} strokeWidth={2.1} strokeLinejoin="round" strokeLinecap="round" fill="none">
          <Path d="M 8.6 5 L 20 5 C 21 5 21.8 5.8 21.8 6.8 L 21.8 17.2 C 21.8 18.2 21 19 20 19 L 8.6 19 L 2.4 12 Z" />
          <Path d="M 11.5 9 L 17 14.8 M 17 9 L 11.5 14.8" />
        </G>,
      );
    case 'tabHome':
      return S(G24, <Path d="M 12 3 L 21 10.6 L 21 20 C 21 20.6 20.6 21 20 21 L 15 21 L 15 15 L 9 15 L 9 21 L 4 21 C 3.4 21 3 20.6 3 20 L 3 10.6 Z" fill={c ?? '#2F74E8'} />);
    case 'tabStar':
      return S(G48, <Path d={STAR} fill={c ?? '#6E86CF'} />);
    case 'tabLeaf':
      return S(
        G24,
        <G fill={c ?? '#6E86CF'}>
          <Path d="M 11.4 13.6 C 5.6 14 2 10.4 2.2 4.4 C 8 4.2 11.8 7.8 11.4 13.6 Z" />
          <Path d="M 12.6 12.4 C 12.4 6.6 15.8 3 21.8 3.2 C 22 9 18.4 12.6 12.6 12.4 Z" />
          <Rect x={11.1} y={11} width={1.8} height={10} rx={0.9} />
        </G>,
      );
    case 'tabBars':
      return S(G24, <G fill={c ?? '#6E86CF'}><Rect x={3} y={12} width={5} height={9} rx={1.6} /><Rect x={9.5} y={7} width={5} height={14} rx={1.6} /><Rect x={16} y={3} width={5} height={18} rx={1.6} /></G>);
    case 'tabPerson':
      return S(G24, <G fill={c ?? '#6E86CF'}><Circle cx={12} cy={7.4} r={4.4} /><Path d="M 3.6 21 C 3.6 15.6 7.2 13 12 13 C 16.8 13 20.4 15.6 20.4 21 Z" /></G>);
    case 'tabLearners':
      return S(G24, <G fill={c ?? '#6E86CF'}><Circle cx={12} cy={7} r={4} /><Path d="M 4.6 21 C 4.6 15.6 7.8 12.6 12 12.6 C 16.2 12.6 19.4 15.6 19.4 21 Z" /></G>);
    case 'tabGoals':
      return S(
        G24,
        <G fill={c ?? '#6E86CF'}>
          <Path d="M 12 6.6 C 13 4.6 15.4 3.6 17.6 4.4 C 16.8 6.4 14.6 7.4 12.6 7.2 Z" />
          <Path d="M 12 7.6 C 16.6 6 21 8.6 21 13.4 C 21 18 17.6 21 14.8 21 C 13.8 21 12.9 20.6 12 20.6 C 11.1 20.6 10.2 21 9.2 21 C 6.4 21 3 18 3 13.4 C 3 8.6 7.4 6 12 7.6 Z" />
        </G>,
      );
    case 'tabTools':
      return S(
        G24,
        <G fill={c ?? '#6E86CF'}>
          <Rect x={3} y={6} width={18} height={15} rx={3} />
          <Rect x={8.5} y={3} width={7} height={4.6} rx={1.6} fill="none" stroke={c ?? '#6E86CF'} strokeWidth={2} />
          <Path d="M 9 13.4 C 9 12.2 10.6 12 11.4 13 L 12 13.6 L 12.6 13 C 13.4 12 15 12.2 15 13.4 C 15 15 12 17 12 17 C 12 17 9 15 9 13.4 Z" fill="#FFFFFF" />
        </G>,
      );
    case 'tabInsights':
      return S(
        G24,
        <G fill={c ?? '#6E86CF'}>
          <Path d="M 12 2.6 C 16.4 2.6 19.6 5.8 19.6 9.8 C 19.6 13.8 16.4 15 16.4 17 L 7.6 17 C 7.6 15 4.4 13.8 4.4 9.8 C 4.4 5.8 7.6 2.6 12 2.6 Z" />
          <Rect x={8.4} y={18.2} width={7.2} height={2.8} rx={1.2} />
        </G>,
      );
    case 'speaker':
      return S(
        G24,
        <G>
          <Path d="M 3 9.4 L 7 9.4 L 12 5 L 12 19 L 7 14.6 L 3 14.6 Z" fill={c ?? '#2F74E8'} />
          <Path d="M 15.4 8.6 C 16.6 9.6 17.2 10.8 17.2 12 C 17.2 13.2 16.6 14.4 15.4 15.4 M 18 6 C 19.8 7.6 20.8 9.8 20.8 12 C 20.8 14.2 19.8 16.4 18 18" stroke={c ?? '#2F74E8'} strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>,
      );
    case 'play':
      return S(G24, <Path d="M 7 4.6 L 19.6 12 L 7 19.4 Z" fill={c ?? '#FFFFFF'} strokeLinejoin="round" stroke={c ?? '#FFFFFF'} strokeWidth={1.6} />);
    case 'pause':
      return S(G24, <G fill={c ?? '#FFFFFF'}><Rect x={6} y={5} width={4.4} height={14} rx={1.4} /><Rect x={13.6} y={5} width={4.4} height={14} rx={1.4} /></G>);
    case 'edit':
      return S(G24, <Path d="M 4 16.6 L 4 20 L 7.4 20 L 17.6 9.8 L 14.2 6.4 Z M 15.6 5 L 17.2 3.4 C 17.8 2.8 18.8 2.8 19.4 3.4 L 20.6 4.6 C 21.2 5.2 21.2 6.2 20.6 6.8 L 19 8.4 Z" fill={c ?? '#2F74E8'} />);
    case 'download':
      return S(G24, <Path d="M 12 3.6 L 12 15 M 7 10.4 L 12 15.4 L 17 10.4 M 4.6 19.6 L 19.4 19.6" stroke={c ?? '#2F74E8'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
    default:
      return S(G24, <Circle cx={12} cy={12} r={8} fill={c ?? '#A7B0D8'} />);
  }
});

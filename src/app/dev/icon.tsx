import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Fox } from '@/components/characters/fox/Fox';

type Variant = 'icon' | 'adaptive-fg' | 'adaptive-bg' | 'splash';

/** The fox's head size (as a share of the canvas) for each asset. */
const HEAD: Record<Variant, number> = { icon: 0.9, 'adaptive-fg': 0.66, 'adaptive-bg': 0, splash: 0.92 };

/** Soft sky with a sunrise glow — the backdrop of the app icon. */
function IconBackdrop({ s }: { s: number }) {
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r1 = s * 0.36;
    const r2 = s * 0.75;
    rays.push(
      <Path
        key={i}
        d={`M ${s / 2 + Math.cos(a - 0.07) * r1} ${s * 0.46 + Math.sin(a - 0.07) * r1} L ${s / 2 + Math.cos(a) * r2} ${s * 0.46 + Math.sin(a) * r2} L ${s / 2 + Math.cos(a + 0.07) * r1} ${s * 0.46 + Math.sin(a + 0.07) * r1} Z`}
        fill="#FFFFFF"
        opacity={0.22}
      />,
    );
  }
  return (
    <Svg width={s} height={s} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <LinearGradient id="iconSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D8ECFE" />
          <Stop offset="1" stopColor="#A9D1FA" />
        </LinearGradient>
        <RadialGradient id="iconGlow" cx="50%" cy="46%" rx="42%" ry="42%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={s} height={s} fill="url(#iconSky)" />
      <G>{rays}</G>
      <Circle cx={s / 2} cy={s * 0.46} r={s * 0.42} fill="url(#iconGlow)" />
      <Path d={`M 0 ${s * 0.86} C ${s * 0.3} ${s * 0.8} ${s * 0.7} ${s * 0.8} ${s} ${s * 0.86} L ${s} ${s} L 0 ${s} Z`} fill="#8FD17E" />
      <Path d={`M 0 ${s * 0.92} C ${s * 0.35} ${s * 0.87} ${s * 0.65} ${s * 0.88} ${s} ${s * 0.93} L ${s} ${s} L 0 ${s} Z`} fill="#6DBE6A" />
    </Svg>
  );
}

/**
 * Dev-only artwork renderer used to produce the app icon, Android adaptive
 * icon layers and splash image from the real fox rig (see README).
 * Params: variant, px (canvas size), bg (flat background for alpha matting).
 */
export default function IconArt() {
  const params = useLocalSearchParams<{ variant?: Variant; px?: string; bg?: string }>();
  const variant: Variant = params.variant ?? 'icon';
  const s = Number(params.px ?? 1024);
  const head = HEAD[variant] * s;
  const backdrop = variant === 'icon' || variant === 'adaptive-bg';
  return (
    <View style={{ width: s, height: s, backgroundColor: params.bg ?? 'transparent', overflow: 'hidden' }}>
      {backdrop ? <IconBackdrop s={s} /> : null}
      {head > 0 ? (
        <View style={{ position: 'absolute', left: 0, top: 0, width: s, height: s, alignItems: 'center', justifyContent: 'center', paddingTop: variant === 'icon' ? s * 0.04 : 0 }}>
          <Fox pose="head" size={head} motion="off" interactive={false} accessibilityLabel="BrightPath fox" />
        </View>
      ) : null}
    </View>
  );
}

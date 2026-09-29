import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Appear, Button, Callout, CheckBadge, Header, Screen, Tap, Txt } from '@/components/ui';
import type { ArtId, MissionStep } from '@/content/types';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { colors, radius } from '@/theme';

import type { StepProps } from './context';

function Toothbrushes({ size = 142 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx={62} cy={106} rx={48} ry={8} fill="#DCEAFB" />
      <G2 />
    </Svg>
  );
}

function G2() {
  return (
    <>
      <Path d="M 18 30 C 20 26 26 26 28 30 L 42 98 C 43 104 34 106 33 100 Z" fill="#2F7BEA" />
      <Rect x={14} y={14} width={16} height={22} rx={4} fill="#FFFFFF" stroke="#BFD8F8" strokeWidth={2} transform="rotate(-12 22 25)" />
      <Path d="M 17 16 L 17 30 M 21 15 L 21 29 M 25 14 L 25 28" stroke="#9CC6F8" strokeWidth={2} transform="rotate(-12 22 25)" />
      <Path d="M 70 14 C 72 10 78 10 80 14 L 76 70 C 75 76 67 75 68 69 Z" fill="#2FB0C8" />
      <Rect x={66} y={4} width={16} height={20} rx={4} fill="#FFFFFF" stroke="#BFE6EE" strokeWidth={2} transform="rotate(8 74 14)" />
      <Path d="M 48 50 L 96 50 L 90 104 L 54 104 Z" fill="#F7708A" />
      <Path d="M 46 46 L 98 46 L 97 54 L 47 54 Z" fill="#F98CA0" />
      <Path d="M 62 56 L 64 100" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
    </>
  );
}

function Art({ art }: { art: ArtId }) {
  switch (art) {
    case 'toothbrush':
      return <Toothbrushes />;
    case 'foxReading':
      return <Fox pose="read" size={152} />;
    case 'shirt':
      return <Icon name="shirt" size={112} />;
    case 'bowl':
      return <Icon name="bowl" size={112} />;
    default:
      return <Fox pose="bust" size={130} />;
  }
}

/** 12 · First-Then — a transition support: finish one small step, then the next. */
export function StepFirstThen({ step, next }: StepProps<Extract<MissionStep, { type: 'firstThen' }>>) {
  const level = useMotionLevel();
  const [firstDone, setFirstDone] = useState(false);
  const arrow = useSharedValue(0);
  useEffect(() => {
    if (level === 'off') return;
    arrow.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [level, arrow]);
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: arrow.value * 6 }] }));

  return (
    <Screen header={<Header title={step.title} subtitle={step.subtitle} right={<MyToolsButton />} />} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={styles.row}>
        <Appear style={[styles.col, { backgroundColor: '#FDF1D8' }]}>
          <Txt v="heading" center color={colors.ink} style={{ fontSize: 24, marginBottom: 10 }}>
            First
          </Txt>
          <Tap
            onPress={() => {
              setFirstDone((d) => !d);
              playSound('sparkle', 0.4);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: firstDone }}
            accessibilityLabel={`${step.first.line1} ${step.first.line2}${firstDone ? ', done' : ''}`}
            style={styles.inner}
          >
            <Art art={step.first.art} />
            <Txt v="heading" center color={colors.ink} style={{ fontSize: 26, lineHeight: 31, marginTop: 8 }}>
              {step.first.line1}
            </Txt>
            <Txt v="bodyLg" center color={colors.ink} style={{ fontSize: 22 }}>
              {step.first.line2}
            </Txt>
            {firstDone ? <CheckBadge size={36} style={{ position: 'absolute', top: 8, right: 8 }} /> : null}
          </Tap>
        </Appear>
        <Animated.View style={[styles.arrow, arrowStyle]}>
          <Svg width={30} height={30} viewBox="0 0 24 24">
            <Path d="M 3 12 L 20 12 M 13 5 L 20 12 L 13 19" stroke={colors.cobalt} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Animated.View>
        <Appear delay={150} style={[styles.col, { backgroundColor: '#E2F5E6' }]}>
          <Txt v="heading" center color={colors.ink} style={{ fontSize: 24, marginBottom: 10 }}>
            Then
          </Txt>
          <View style={[styles.inner, firstDone ? { borderColor: colors.mint } : null]}>
            <Art art={step.then.art} />
            <Txt v="heading" center color={colors.ink} style={{ fontSize: 26, lineHeight: 31, marginTop: 8 }}>
              {step.then.line1}
            </Txt>
            <Txt v="bodyLg" center color={colors.ink} style={{ fontSize: 22 }}>
              {step.then.line2}
            </Txt>
          </View>
        </Appear>
      </View>
      <Appear delay={300}>
        <Callout tone="sky" art={<Fox pose="head" size={92} interactive={false} />} text={step.tip} style={{ marginTop: 18, paddingVertical: 16 }} />
      </Appear>
      <Button title={step.cta} onPress={next} style={{ marginTop: 18 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  col: { flex: 1, borderRadius: radius.xl, padding: 10, paddingTop: 14 },
  inner: { backgroundColor: '#FFFFFF', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 6, minHeight: 286, justifyContent: 'center', borderWidth: 2.5, borderColor: 'transparent' },
  arrow: { width: 30, alignItems: 'center', marginHorizontal: -3, zIndex: 2 },
});

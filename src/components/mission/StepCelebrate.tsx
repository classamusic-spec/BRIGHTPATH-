import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, Callout, FitBox, Header, Screen, TwinkleStar, Txt } from '@/components/ui';
import type { MissionStep } from '@/content/types';
import { successHaptic } from '@/lib/feedback';
import { useCelebration, useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';
import { colors, GUTTER, radius, shadows } from '@/theme';

import type { StepProps } from './context';

const STAR_SPOTS = [
  { left: '18%', top: '4%', size: 46 },
  { left: '8%', top: '26%', size: 34 },
  { left: '4%', top: '48%', size: 52 },
  { left: '12%', top: '76%', size: 36 },
  { left: '80%', top: '10%', size: 42 },
  { left: '84%', top: '36%', size: 30 },
  { left: '82%', top: '68%', size: 54 },
];

/** 08 · Success */
export function StepSuccess({ step, next }: StepProps<Extract<MissionStep, { type: 'success' }>>) {
  const insets = useSafeAreaInsets();
  const celebration = useCelebration();
  useEffect(() => {
    playSound('sparkle', 0.5);
    successHaptic();
    speak(`${step.title} ${step.message}`);
  }, [step.title, step.message]);
  const spots = celebration === 'minimal' ? [] : celebration === 'gentle' ? STAR_SPOTS.slice(0, 4) : STAR_SPOTS;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape
        style={StyleSheet.absoluteFill}
        spec={{
          skyTop: '#E6F3FD',
          skyBottom: '#F4FAFE',
          horizon: 0.98,
          ground: 0.99,
          bushes: [
            { x: 0.02, base: 0.7, s: 2.4, tone: 'light' },
            { x: 0.98, base: 0.74, s: 2.2, tone: 'light' },
          ],
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <Header title="" right={<MyToolsButton />} />
      </View>
      <FitBox style={styles.stage} max={370} min={140}>
        {(size) => (
          <>
            {spots.map((s, i) => (
              <TwinkleStar key={i} size={s.size} delay={i * 120} style={{ left: s.left as never, top: s.top as never }} />
            ))}
            <Fox pose="jump" size={size} />
          </>
        )}
      </FitBox>
      <Appear style={{ paddingHorizontal: GUTTER + 4, paddingBottom: Math.max(insets.bottom, 12) + 6 }}>
        <Txt v="display" center style={{ fontSize: 46, lineHeight: 52 }}>
          {step.title}
        </Txt>
        <Txt v="bodyLg" center color={colors.text} style={{ fontSize: 24, lineHeight: 31, marginTop: 6, marginBottom: 20 }}>
          {step.message.replace(' and ', '\nand ')}
        </Txt>
        <Button title={step.cta} onPress={next} />
        <View style={styles.tip}>
          <Icon name="sprout" size={56} />
          <Txt v="bodyLg" color={colors.text} style={{ fontSize: 21, lineHeight: 27, flexShrink: 1 }}>
            {step.tip.replace(' a big', '\na big')}
          </Txt>
        </View>
      </Appear>
    </View>
  );
}

/** 16 · Positive Feedback */
export function StepFeedback({ step, next }: StepProps<Extract<MissionStep, { type: 'feedback' }>>) {
  const celebration = useCelebration();
  useEffect(() => {
    playSound('chime', 0.5);
    successHaptic();
    speak(`${step.title} ${step.subtitle}`);
  }, [step.title, step.subtitle]);
  return (
    <Screen
      padded={false}
      header={<Header title={step.title} subtitle={step.subtitle} right={<MyToolsButton />} />}
      footer={<Button title={step.cta} onPress={next} />}
      contentStyle={{ flexGrow: 1 }}
    >
      <View style={styles.cheerStage}>
        <Landscape
          style={StyleSheet.absoluteFill}
          spec={{
            skyTop: '#EEF6FD',
            skyBottom: '#F3F9FE',
            horizon: 0.62,
            ground: 0.7,
            bushes: [
              { x: 0.06, base: 0.66, s: 1.6, tone: 'deep' },
              { x: 0.2, base: 0.72, s: 1.1 },
              { x: 0.86, base: 0.66, s: 1.6, tone: 'deep' },
              { x: 0.95, base: 0.74, s: 1.2 },
            ],
          }}
        />
        {celebration !== 'minimal' && (
          <>
            <TwinkleStar size={48} style={{ left: '14%', top: '6%' }} />
            <TwinkleStar size={50} style={{ left: '8%', top: '36%' }} delay={200} />
            <TwinkleStar size={48} style={{ left: '74%', top: '8%' }} delay={100} />
            <TwinkleStar size={50} style={{ left: '80%', top: '38%' }} delay={300} />
          </>
        )}
        <Fox pose="cheer" size={312} />
      </View>
      <View style={styles.badgeRow}>
        {step.badges.map((b, i) => (
          <Appear key={b.line1} delay={150 + i * 120} from="zoom" style={styles.badge}>
            <Icon name={b.icon} size={60} />
            <Txt v="heading" center color={colors.ink} style={{ marginTop: 8, fontSize: 21, lineHeight: 24 }}>
              {b.line1}
            </Txt>
            <Txt v="bodyLg" center color={colors.text} style={{ fontSize: 20, lineHeight: 24 }}>
              {b.line2}
            </Txt>
          </Appear>
        ))}
      </View>
      <Appear delay={500} style={{ paddingHorizontal: GUTTER }}>
        <Callout tone="sky" art={<Icon name="sprout" size={56} />} text={step.tip} style={{ marginTop: 14, paddingVertical: 16 }} />
      </Appear>
    </Screen>
  );
}

function BigStar() {
  const level = useMotionLevel();
  const s = useSharedValue(level === 'off' ? 1 : 0.2);
  const spin = useSharedValue(0);
  useEffect(() => {
    if (level === 'off') return;
    s.value = withSequence(withSpring(1.12, { damping: 6, stiffness: 140 }), withSpring(1, { damping: 10 }));
    spin.value = withDelay(500, withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [level, s, spin]);
  const star = useAnimatedStyle(() => ({ transform: [{ scale: s.value * (1 + spin.value * 0.04) }, { rotate: `${(spin.value - 0.5) * 8}deg` }] }));
  const rays = useAnimatedStyle(() => ({ opacity: 0.6 + spin.value * 0.4, transform: [{ scale: 0.92 + spin.value * 0.1 }] }));
  const rayEls = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + Math.PI / 10;
    rayEls.push(<Path key={i} d={`M ${100 + Math.cos(a) * 70} ${100 + Math.sin(a) * 70} L ${100 + Math.cos(a) * 90} ${100 + Math.sin(a) * 90}`} stroke="#FDCB4A" strokeWidth={11} strokeLinecap="round" />);
  }
  return (
    <View style={{ width: 230, height: 230, alignSelf: 'center' }} accessibilityRole="image" accessibilityLabel="A shining star">
      <Animated.View style={[StyleSheet.absoluteFill, rays]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          {rayEls}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, star]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="bigStarG" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor="#FFD65E" />
              <Stop offset="1" stopColor="#F5A91B" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 100 40 C 104 40 107 42 109 46 L 122 72 L 151 76 C 159 77 162 87 156 92 L 135 113 L 140 142 C 141 150 133 156 126 152 L 100 138 L 74 152 C 67 156 59 150 60 142 L 65 113 L 44 92 C 38 87 41 77 49 76 L 78 72 L 91 46 C 93 42 96 40 100 40 Z"
            fill="url(#bigStarG)"
          />
          <Path d="M 84 70 L 95 50" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={6} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** 17 · Mission Complete — stars and a badge are awarded here (never removed). */
export function StepComplete({ step, next, mission }: StepProps<Extract<MissionStep, { type: 'complete' }>>) {
  const finishMission = useApp((s) => s.finishMission);
  const runId = useMission((s) => s.runId);
  // Stars are awarded once, when this run is marked complete.
  const completed = useApp((s) => !!runId && !!s.runs.find((r) => r.id === runId)?.completedAt);
  const earned = completed ? mission.stars : 0;
  const done = useRef(false);
  useEffect(() => {
    // Wait for the run (it starts in the mission screen's effect on a deep link).
    if (done.current || !runId) return;
    done.current = true;
    playSound('chime', 0.6);
    successHaptic();
    finishMission(runId);
    speak(`${step.title} ${step.message}`);
  }, [finishMission, runId, step.title, step.message]);
  return (
    <Screen header={<Header title={step.title} right={<MyToolsButton />} />} footer={<Button title={step.cta} onPress={next} />}>
      <BigStar />
      <Txt v="title" center style={{ fontSize: 31, lineHeight: 37, marginTop: 4 }}>
        {step.heading}
      </Txt>
      <Txt v="bodyLg" center color={colors.text} style={{ fontSize: 21, lineHeight: 28, marginTop: 6, maxWidth: 330, alignSelf: 'center' }}>
        {step.message}
      </Txt>
      {earned > 0 ? (
        <Appear from="zoom" style={styles.earned}>
          <Icon name="star" size={26} />
          <Txt v="label" color="#A56A00">{`+${earned} stars for your room!`}</Txt>
        </Appear>
      ) : null}
      <View style={{ gap: 10, marginTop: 14 }}>
        {step.checks.map((c, i) => (
          <Appear key={c} delay={200 + i * 120} style={styles.check}>
            <View style={styles.tick}>
              <Icon name="check" size={34} color="#FFFFFF" />
            </View>
            <Txt v="bodyLg" color={colors.text} style={{ fontSize: 22 }}>
              {c}
            </Txt>
          </Appear>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16, paddingHorizontal: 12 },
  cheerStage: { flexGrow: 1, minHeight: 320, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  badgeRow: { flexDirection: 'row', gap: 10, paddingHorizontal: GUTTER - 4, marginTop: -6 },
  badge: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 16, ...shadows.soft },
  check: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 12, ...shadows.soft },
  tick: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  earned: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', backgroundColor: colors.butterSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: 10 },
});

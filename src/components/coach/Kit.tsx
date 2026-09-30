import { router } from 'expo-router';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Share, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Icon, type IconName } from '@/components/icons/Icon';
import { BottomNav, Button, Header, Screen, Sheet } from '@/components/ui';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import type { Learner, SkillArea } from '@/engine/types';
import { fitFontSize } from '@/lib/fitText';
import { useMotionLevel } from '@/lib/motion';
import { colors, fonts, radius, shadows } from '@/theme';

import { useRouteLearner } from './useRouteLearner';

/* ------------------------------------------------------------ Navigation */

export function CoachNav({ active }: { active: 'home' | 'learners' | 'goals' | 'tools' | 'more' }) {
  const go = (href: string) => () => (active === 'home' && href === '/coach' ? null : router.replace(href as never));
  return (
    <BottomNav
      active={active}
      items={[
        { key: 'home', label: 'Home', icon: 'tabHome', onPress: go('/coach') },
        { key: 'learners', label: 'Learners', icon: 'tabLearners', onPress: go('/coach/learners') },
        { key: 'goals', label: 'Goals', icon: 'tabGoals', onPress: go('/coach/goals') },
        { key: 'tools', label: 'Tools', icon: 'tabTools', onPress: go('/coach/tools') },
        { key: 'more', label: 'More', icon: 'tabPerson', onPress: go('/coach/settings') },
      ]}
    />
  );
}

/** Learner-scoped navigation (Growth Map & friends). */
export function LearnerNav({ id, active }: { id: string; active: 'home' | 'progress' | 'tools' | 'insights' | 'more' }) {
  const to = (path: string) => () => router.replace({ pathname: path as never, params: { id } } as never);
  return (
    <BottomNav
      active={active}
      items={[
        { key: 'home', label: 'Home', icon: 'tabHome', onPress: to('/coach/learner/[id]') },
        { key: 'progress', label: 'Progress', icon: 'tabBars', onPress: to('/coach/learner/[id]/growth-map') },
        { key: 'tools', label: 'Tools', icon: 'tabTools', onPress: () => router.push('/coach/tools') },
        { key: 'insights', label: 'Insights', icon: 'tabInsights', onPress: to('/coach/learner/[id]/insights') },
        { key: 'more', label: 'More', icon: 'tabPerson', onPress: to('/coach/learner/[id]/access') },
      ]}
    />
  );
}

/* ---------------------------------------------------------- Skill areas */

export const AREA_META: Record<SkillArea, { label: string; short: string; badge: string; icon: IconName; color: string; bar: string }> = {
  communication: { label: 'Communication', short: 'Comm', badge: 'Communication', icon: 'chatCircle', color: '#F4793A', bar: colors.mint },
  emotions: { label: 'Emotions', short: 'Emotions', badge: 'Emotions', icon: 'faceTeal', color: '#2FB59A', bar: '#3F86F0' },
  focus: { label: 'Focus', short: 'Focus', badge: 'Focus', icon: 'star', color: '#F7B731', bar: '#7CCBF4' },
  social: { label: 'Social Skills', short: 'Social', badge: 'Social Skills', icon: 'group', color: '#9A6BF0', bar: '#A99BF7' },
  independence: { label: 'Independence', short: 'Indep', badge: 'Independence', icon: 'starCircle', color: '#F7B731', bar: colors.butter },
  routines: { label: 'Daily Routines', short: 'Routines', badge: 'Routines', icon: 'calendarCircle', color: '#9A6BF0', bar: '#B28CF4' },
};

/**
 * Skill-area glyph. `matrix` is the line-icon family used by the Context
 * Matrix and Progress Report; `badge` is the solid round family used by
 * Recent Progress and the Weekly Summary.
 */
export function AreaIcon({ area, size = 40, variant = 'matrix' }: { area: SkillArea; size?: number; variant?: 'matrix' | 'badge' }) {
  if (variant === 'badge' && area !== 'social') {
    return <Icon name={AREA_META[area].icon} size={size} color={area === 'emotions' ? '#35BFC8' : undefined} />;
  }
  if (area === 'social') {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="group" size={size * 0.72} color="#8E63EE" />
      </View>
    );
  }
  if (area === 'independence') {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E4F0FE', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="runner" size={size * 0.7} color="#2F74E8" />
      </View>
    );
  }
  if (area === 'routines') {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E6EAF8', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="gear" size={size * 0.72} color="#5B6AC8" />
      </View>
    );
  }
  if (area === 'emotions') {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.blushSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="heart" size={size * 0.7} />
      </View>
    );
  }
  if (area === 'focus') return <Icon name="star" size={size} />;
  return <Icon name="faceTeal" size={size} color="#2FAE72" />;
}

/* -------------------------------------------------------------- Charts */

export function GrowBar({ value, color, height, width = 38, delay = 0, radiusPx = 10 }: { value: number; color: string; height: number; width?: number; delay?: number; radiusPx?: number }) {
  const level = useMotionLevel();
  const v = useSharedValue(level === 'off' ? value : 0);
  useEffect(() => {
    v.value = level === 'off' ? value : withDelay(delay, withTiming(value, { duration: 800 }));
  }, [value, level, delay, v]);
  const style = useAnimatedStyle(() => ({ height: Math.max(6, v.value * height) }));
  return <Animated.View style={[{ width, borderRadius: radiusPx, backgroundColor: color }, style]} />;
}

export function WeekBars({ days, height = 150 }: { days: { label: string; count: number }[]; height?: number }) {
  const max = Math.max(4, ...days.map((d) => d.count));
  const palette = ['#2FB59A', '#3FB8A0', '#7CCBF4', '#8FCBF6', '#B8C4F7', '#C9CBF8', '#C3B2F6'];
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: height + 22, paddingHorizontal: 4 }}>
        {days.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }} accessible accessibilityLabel={`${d.label}: ${d.count} observation${d.count === 1 ? '' : 's'}`}>
            <Txt v="caption" color={colors.textMuted} style={{ fontSize: 13, marginBottom: 4 }}>
              {String(d.count)}
            </Txt>
            <GrowBar value={d.count / max} color={palette[i % palette.length]} height={height} width={34} delay={i * 60} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 8 }}>
        {days.map((d, i) => (
          <Txt key={i} v="label" center color={colors.text} style={{ flex: 1, fontSize: 16 }}>
            {d.label}
          </Txt>
        ))}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------- Cards */

export function StatCard({ icon, value, label, valueColor = colors.tealDeep, style, onPress }: { icon: ReactNode; value: string; label: string; valueColor?: string; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const [labelW, setLabelW] = useState(0);
  // Web has no adjustsFontSizeToFit: shrink so the longest word never breaks mid-word.
  const labelSize = Math.min(...label.split(/\s+/).map((w) => fitFontSize(w, fonts.semibold, 15, 11.5, labelW)));
  const body = (
    <View style={[styles.stat, style]}>
      {icon}
      <View style={{ flex: 1, minWidth: 0, marginLeft: 8 }} onLayout={(e) => setLabelW(e.nativeEvent.layout.width)}>
        <Txt v="number" color={valueColor} style={{ fontSize: 30, lineHeight: 34 }}>
          {value}
        </Txt>
        <Txt v="body" color={colors.text} style={{ fontSize: labelSize, lineHeight: 19 }} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label}
        </Txt>
      </View>
    </View>
  );
  // Equal columns whatever the label length (flexBasis 0, may shrink below content).
  if (!onPress) return <View style={styles.statCell}>{body}</View>;
  return (
    <Tap onPress={onPress} accessibilityLabel={`${value} ${label}`} style={styles.statCell}>
      {body}
    </Tap>
  );
}

/** "{n} goals to review" — the plan needs a look, not the child. */
export function ReviewChip({ n }: { n: number }) {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 }}>
      <Txt v="caption" color={colors.primaryDeep}>{`${n} goal${n === 1 ? '' : 's'} to review`}</Txt>
    </View>
  );
}

/** Card section heading with an optional text action (e.g. "View All"). */
export function CardHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, style]}>
      <Txt v="heading" color={colors.heading} style={{ fontSize: 21, lineHeight: 27, flexShrink: 1 }} accessibilityRole="header">
        {title}
      </Txt>
      {action && onAction ? (
        <Tap onPress={onAction} accessibilityRole="link" accessibilityLabel={`${action}: ${title}`} style={{ paddingVertical: 12, paddingLeft: 12 }} hitSlop={6}>
          <Txt v="label" color={colors.primary} style={{ fontSize: 16 }}>
            {action}
          </Txt>
        </Tap>
      ) : null}
    </View>
  );
}

/** Share glyph (box with an up arrow) for header actions. */
export function ShareGlyph({ size = 24, color = colors.cobalt }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Every shared summary ends with this line. */
export const NOT_A_DIAGNOSIS = 'Educational summary — not a diagnosis.';

/**
 * Header share action: the native share sheet (or the browser's), and where
 * that is unavailable a sheet with the text to copy. Text only, never photos.
 */
export function ShareAction({ title, message }: { title: string; message: string }) {
  const [fallback, setFallback] = useState(false);
  const text = `${message}\n\n${NOT_A_DIAGNOSIS}`;
  return (
    <>
      <Tap
        onPress={() => {
          Share.share({ title, message: text }).catch(() => setFallback(true));
        }}
        accessibilityLabel={`Share ${title}`}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <ShareGlyph size={26} />
      </Tap>
      <Sheet visible={fallback} onClose={() => setFallback(false)} title={`Share ${title}`} subtitle="Sharing isn’t available here. Select and copy the text below.">
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 14 }}>
          <Txt v="body" selectable>
            {text}
          </Txt>
        </View>
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------ Route learner */

export function LearnerNotFound() {
  return (
    <Screen header={<Header title="Learner not found" />}>
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 40 }}>
        <Icon name="person" size={72} />
        <Txt v="body" center color={colors.textSoft}>
          This learner isn’t on this device. They may have been removed, or the link is out of date.
        </Txt>
        <Button title="See all learners" kind="soft" size="md" onPress={() => router.replace('/coach/learners')} />
      </View>
    </Screen>
  );
}

/**
 * Wraps a /coach/learner/[id] screen: resolves the route learner once and
 * shows "Learner not found" for an unknown id, so the screen itself can rely
 * on a real learner.
 */
export function withRouteLearner(Inner: ComponentType<{ learner: Learner }>) {
  function RouteLearnerScreen() {
    const learner = useRouteLearner();
    return learner ? <Inner learner={learner} /> : <LearnerNotFound />;
  }
  RouteLearnerScreen.displayName = `withRouteLearner(${Inner.displayName ?? Inner.name ?? 'Screen'})`;
  return RouteLearnerScreen;
}

/** Rolling hills strip used at the bottom of calm coach cards. */
export function HillStrip({ height = 44, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 390 44" preserveAspectRatio="none" style={style} pointerEvents="none">
      <Path d="M 0 30 C 60 14 120 18 190 28 C 260 38 320 20 390 24 L 390 44 L 0 44 Z" fill="#B9E59B" />
      <Path d="M 0 38 C 90 28 200 30 390 36 L 390 44 L 0 44 Z" fill="#A6DB88" />
    </Svg>
  );
}

export const coachStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: radius.lg, ...shadows.soft },
});

const styles = StyleSheet.create({
  statCell: { flex: 1, flexBasis: 0, minWidth: 0 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radius.lg, paddingVertical: 14, paddingLeft: 12, paddingRight: 8, minHeight: 96, ...shadows.soft },
});

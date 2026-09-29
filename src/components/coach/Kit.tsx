import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Icon, type IconName } from '@/components/icons/Icon';
import { BottomNav } from '@/components/ui';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import type { SkillArea } from '@/engine/types';
import { useMotionLevel } from '@/lib/motion';
import { colors, radius, shadows } from '@/theme';

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

export const AREA_META: Record<SkillArea, { label: string; short: string; icon: IconName; color: string; bar: string }> = {
  communication: { label: 'Communication', short: 'Comm', icon: 'chatCircle', color: '#F4793A', bar: colors.mint },
  emotions: { label: 'Emotions', short: 'Emotions', icon: 'faceTeal', color: '#2FB59A', bar: '#3F86F0' },
  focus: { label: 'Focus', short: 'Focus', icon: 'star', color: '#F7B731', bar: '#7CCBF4' },
  social: { label: 'Social Skills', short: 'Social', icon: 'group', color: '#9A6BF0', bar: '#A99BF7' },
  independence: { label: 'Independence', short: 'Indep', icon: 'starCircle', color: '#F7B731', bar: colors.butter },
  routines: { label: 'Daily Routines', short: 'Routines', icon: 'calendarCircle', color: '#9A6BF0', bar: '#B28CF4' },
};

export function AreaIcon({ area, size = 40 }: { area: SkillArea; size?: number }) {
  const m = AREA_META[area];
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height, paddingHorizontal: 4 }}>
        {days.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }} accessible accessibilityLabel={`${d.label}: ${d.count} observations`}>
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
  const body = (
    <View style={[styles.stat, style]}>
      {icon}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Txt v="number" color={valueColor} style={{ fontSize: 30, lineHeight: 34 }}>
          {value}
        </Txt>
        <Txt v="body" color={colors.text} style={{ fontSize: 16, lineHeight: 20 }}>
          {label}
        </Txt>
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Tap onPress={onPress} accessibilityLabel={`${value} ${label}`} style={{ flex: 1 }}>
      {body}
    </Tap>
  );
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
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 14, minHeight: 96, ...shadows.soft },
});

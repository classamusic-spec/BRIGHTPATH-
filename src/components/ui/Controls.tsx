import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useMotionLevel } from '@/lib/motion';
import { colors, radius, shadows, tones, type Tone } from '@/theme';
import { durations, easings, springs } from '@/theme/motion';

import { IconTile } from './Card';
import { Tap } from './Tap';
import { Txt } from './Txt';

/* -------------------------------------------------------------- Tabs */

/** Underlined tabs on a soft track (Overview · Learners · Insights). */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  style,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segTrack, style]} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Tap
            key={it.key}
            onPress={() => onChange(it.key)}
            style={[styles.segItem, { flex: Math.max(8, it.label.length) }, active ? styles.segActive : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={it.label}
            scale={0.98}
          >
            <Txt v="label" color={active ? colors.ink : colors.textSoft} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 16.5 }}>
              {it.label}
            </Txt>
            {active ? <View style={styles.segUnderline} /> : null}
          </Tap>
        );
      })}
    </View>
  );
}

/** Filled pill tabs (1W · 1M · 3M · 1Y, Rewards · Room). */
export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  style,
  size = 'md',
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
}) {
  return (
    <View style={[styles.pillTrack, size === 'lg' ? { minHeight: 54 } : null, style]} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Tap
            key={it.key}
            onPress={() => onChange(it.key)}
            style={[styles.pillItem, active ? styles.pillActive : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={it.label}
            scale={0.97}
          >
            <Txt v="label" color={active ? colors.onPrimary : colors.text} style={{ fontSize: size === 'lg' ? 18 : 15 }}>
              {it.label}
            </Txt>
          </Tap>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------ Toggle */

const TOGGLE_W = 64;
const TOGGLE_H = 44;
const KNOB = 38;

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const level = useMotionLevel();
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.value = level === 'off' ? (value ? 1 : 0) : withSpring(value ? 1 : 0, springs.settle);
  }, [value, level, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * (TOGGLE_W - KNOB - 6) }] }));
  const track = useAnimatedStyle(() => ({ opacity: x.value }));
  return (
    <Tap
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      scale={0.97}
      style={styles.toggle}
    >
      <View style={[StyleSheet.absoluteFill, styles.toggleOff]} />
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: TOGGLE_H / 2, backgroundColor: colors.primary }, track]} />
      <Animated.View style={[styles.knob, knob]}>{value ? <Icon name="check" size={14} color={colors.primary} /> : null}</Animated.View>
    </Tap>
  );
}

/* -------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  color = colors.mint,
  height = 12,
  track = '#E3E8F2',
  style,
  delay = 0,
  from,
}: {
  value: number;
  /** Where the fill starts (e.g. last round's progress) so it grows instead of restarting at 0. */
  from?: number;
  color?: string;
  height?: number;
  track?: string;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const level = useMotionLevel();
  const w = useSharedValue(level === 'off' ? value : (from ?? 0));
  useEffect(() => {
    const t = setTimeout(() => {
      w.value = level === 'off' ? value : withTiming(value, { duration: durations.progress, easing: easings.out });
    }, delay);
    return () => clearTimeout(t);
  }, [value, level, delay, w]);
  // Width (not scaleX) so the rounded end keeps its shape as it grows.
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, w.value)) * 100}%` }));
  return (
    <View
      style={[{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, fill]} />
    </View>
  );
}

/* ------------------------------------------------------------- Chips */

export function Chip({
  label,
  tone = 'blue',
  icon,
  onPress,
  selected,
  size = 'md',
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const t = tones[tone];
  const content = (
    <View
      style={[
        styles.chip,
        size === 'sm' ? styles.chipSm : null,
        onPress ? (size === 'sm' ? styles.chipSmTap : styles.chipTap) : null,
        { backgroundColor: selected === false ? '#EEF2F9' : t.bg, borderColor: selected ? t.deep : 'transparent' },
        style,
      ]}
    >
      {icon}
      <Txt v="label" color={selected === false ? colors.textMuted : tone === 'blush' ? colors.dangerText : tone === 'mint' ? colors.mintText : colors.text} style={{ fontSize: size === 'sm' ? 12.5 : 14 }}>
        {label}
      </Txt>
    </View>
  );
  if (!onPress) return content;
  return (
    <Tap onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!selected }} accessibilityLabel={label} scale={0.95}>
      {content}
    </Tap>
  );
}

export function StatusPill({ label, color = colors.mint, bg = colors.mintSoft }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.status, { backgroundColor: bg }]}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color }} />
      <Txt v="label" color={colors.mintText} style={{ fontSize: 15 }}>
        {label}
      </Txt>
    </View>
  );
}

/* --------------------------------------------------------- Check badge */

export function CheckBadge({ size = 30, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const level = useMotionLevel();
  const s = useSharedValue(level === 'off' ? 1 : 0.2);
  useEffect(() => {
    s.value = level === 'off' ? 1 : withSpring(1, springs.pop);
  }, [level, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#FFFFFF' },
        shadows.soft,
        anim,
        style,
      ]}
    >
      <Icon name="check" size={size * 0.62} color="#FFFFFF" />
    </Animated.View>
  );
}

/* ------------------------------------------------------------ ListRow */

export function ListRow({
  icon,
  iconTone,
  iconNode,
  title,
  subtitle,
  value,
  right,
  onPress,
  tileSize = 50,
  titleSize = 19,
  style,
  plainIcon,
}: {
  icon?: IconName;
  iconTone?: Tone;
  iconNode?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  tileSize?: number;
  /** Title font size; the subtitle follows 3pt smaller. */
  titleSize?: number;
  style?: StyleProp<ViewStyle>;
  plainIcon?: boolean;
}) {
  const iconEl = iconNode ?? (icon ? (plainIcon ? <View style={{ width: tileSize, alignItems: 'center' }}><Icon name={icon} size={tileSize * 0.72} /></View> : <IconTile tone={iconTone ?? 'blue'} size={tileSize}><Icon name={icon} size={tileSize * 0.62} /></IconTile>) : null);
  const body = (
    <View style={[styles.row, style]}>
      {iconEl}
      <View style={{ flex: 1, marginLeft: iconEl ? 2 : 0 }}>
        <Txt v="subheading" color={colors.ink} style={{ fontSize: titleSize, lineHeight: Math.round(titleSize * 1.3) }} numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="bodySm" color={colors.textMuted} style={{ fontSize: titleSize - 3, lineHeight: Math.round((titleSize - 3) * 1.32), marginTop: 1 }} numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt v="body" color={colors.textSoft} style={{ fontSize: titleSize - 2 }}>
          {value}
        </Txt>
      ) : null}
      {right ?? (onPress ? <Icon name="chevronRight" size={24} color={colors.cobalt} /> : null)}
    </View>
  );
  if (!onPress) return body;
  return (
    <Tap onPress={onPress} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} scale={0.98}>
      {body}
    </Tap>
  );
}

const styles = StyleSheet.create({
  segTrack: {
    flexDirection: 'row',
    backgroundColor: '#E6EEFA',
    borderRadius: radius.lg,
    padding: 4,
    minHeight: 52,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  segActive: { backgroundColor: '#FFFFFF', ...shadows.soft },
  segUnderline: { position: 'absolute', bottom: 5, left: '14%', right: '14%', height: 3, borderRadius: 2, backgroundColor: colors.cobalt },
  pillTrack: { flexDirection: 'row', backgroundColor: '#E3ECFA', borderRadius: radius.pill, padding: 4, minHeight: 46 },
  pillItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  pillActive: { backgroundColor: colors.primaryPressed, ...shadows.button },
  toggle: { width: TOGGLE_W, height: TOGGLE_H, borderRadius: TOGGLE_H / 2, justifyContent: 'center' },
  toggleOff: { borderRadius: TOGGLE_H / 2, backgroundColor: '#C3CCE0', borderWidth: 1.5, borderColor: '#B4BFD6' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#FFFFFF', marginLeft: 3, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: radius.pill, borderWidth: 1.5 },
  chipSm: { gap: 4, paddingHorizontal: 8, minHeight: 32, borderWidth: 0 },
  // Tappable chips get a full touch target.
  chipTap: { minHeight: 44 },
  chipSmTap: { minHeight: 40 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 40, borderRadius: radius.pill, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
});

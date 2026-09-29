import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/icons/Icon';
import { colors, GUTTER } from '@/theme';

import { Tap } from './Tap';
import { Txt } from './Txt';

/** Pale-blue canvas with a whisper of gradient, as on the reference boards. */
export function Canvas({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Svg style={[StyleSheet.absoluteFill, style]} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id="bpCanvas" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EBF4FD" />
          <Stop offset="0.45" stopColor="#F3F8FD" />
          <Stop offset="1" stopColor="#F5F9FE" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill="url(#bpCanvas)" />
    </Svg>
  );
}

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  padded = true,
  background,
  contentStyle,
  edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom')[];
}) {
  const insets = useSafeAreaInsets();
  const top = edges.includes('top') ? insets.top : 0;
  const bottom = edges.includes('bottom') ? Math.max(insets.bottom, 12) : 0;
  const pad = padded ? GUTTER : 0;
  return (
    <View style={styles.root}>
      {background ?? <Canvas />}
      <View style={{ paddingTop: top }}>{header}</View>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[{ paddingHorizontal: pad, paddingBottom: footer ? 16 : bottom + 16 }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingHorizontal: pad, paddingBottom: footer ? 0 : bottom }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={{ paddingHorizontal: pad, paddingBottom: bottom, paddingTop: 10 }}>{footer}</View> : null}
    </View>
  );
}

export function BackButton({ onPress, color = colors.ink }: { onPress?: () => void; color?: string }) {
  return (
    <Tap
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      accessibilityLabel="Go back"
      style={styles.back}
      hitSlop={10}
    >
      <Icon name="chevronLeft" size={30} color={color} />
    </Tap>
  );
}

/**
 * Screen header: back chevron, centred title, optional subtitle and a right
 * slot (e.g. My Tools, settings or ••• menu).
 */
export function Header({
  title,
  subtitle,
  back = true,
  onBack,
  right,
  align = 'center',
  titleSize = 'title',
  style,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  align?: 'center' | 'left';
  titleSize?: 'title' | 'titleSm';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerRow}>
        <View style={styles.side}>{back ? <BackButton onPress={onBack} /> : null}</View>
        <View style={[styles.titleWrap, align === 'left' ? { alignItems: 'flex-start' } : null]}>
          {title ? (
            <Txt v={titleSize} center={align === 'center'} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">
              {title}
            </Txt>
          ) : null}
        </View>
        <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
      {subtitle ? (
        <Txt v="bodyLg" color={colors.textSoft} center style={{ marginTop: 2, paddingHorizontal: 24 }}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  side: { width: 52, justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

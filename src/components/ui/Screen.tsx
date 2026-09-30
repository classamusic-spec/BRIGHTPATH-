import { router, usePathname } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { fitFontSize } from '@/lib/fitText';
import { colors, fonts, GUTTER } from '@/theme';

import { Tap } from './Tap';
import { Txt } from './Txt';

const CANVAS_GRADIENT = 'linear-gradient(180deg, #EBF4FD 0%, #F3F8FD 45%, #F5F9FE 100%)';

/**
 * Pale-blue canvas with a whisper of gradient, as on the reference boards.
 * A styled View (CSS gradient on web, background image natively) instead of a
 * full-screen SVG; where gradients are unsupported it is the flat bg colour.
 */
const canvasFill: ViewStyle = Platform.select<ViewStyle>({
  web: { backgroundImage: CANVAS_GRADIENT } as ViewStyle,
  default: { experimental_backgroundImage: CANVAS_GRADIENT },
})!;

export function Canvas({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, canvasFill, style]} pointerEvents="none" />;
}

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  padded = true,
  footerPadded = true,
  background,
  contentStyle,
  edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Side gutter on the footer, independent of `padded` (default true). */
  footerPadded?: boolean;
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={[{ paddingHorizontal: pad, paddingBottom: footer ? 16 : bottom + 16 }, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, { paddingHorizontal: pad, paddingBottom: footer ? 0 : bottom }, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={{ paddingHorizontal: footerPadded ? GUTTER : 0, paddingBottom: bottom, paddingTop: 10 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

export function BackButton({ onPress, color = colors.ink }: { onPress?: () => void; color?: string }) {
  const pathname = usePathname();
  // With no history (deep link, refresh), fall back to the hub of the current space.
  const fallback = pathname.startsWith('/coach') ? '/coach' : '/kid/home';
  return (
    <Tap
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace(fallback)))}
      accessibilityLabel="Go back"
      style={styles.back}
      hitSlop={10}
    >
      <Icon name="chevronLeft" size={30} color={color} />
    </Tap>
  );
}

/** Largest header title size, matching the boards (≈29pt on a 390pt phone). */
const TITLE_MAX = { title: 29, titleSm: 25 } as const;
const TITLE_MIN = 18;

/**
 * Screen header: back chevron, centred title, optional subtitle and a right
 * slot (e.g. My Tools, settings or ••• menu). Long titles shrink to stay on
 * one line — natively via adjustsFontSizeToFit, on web by measuring the text.
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
  const { width: windowWidth } = useWindowDimensions();
  const [titleWidth, setTitleWidth] = useState(0);
  const max = TITLE_MAX[titleSize];
  const available = (titleWidth || windowWidth - 24 - 2 * SIDE) - 4;
  const fontSize = title ? fitFontSize(title, fonts.black, max, TITLE_MIN, available, -0.3) : max;
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerRow}>
        <View style={styles.side}>{back ? <BackButton onPress={onBack} /> : null}</View>
        <View style={[styles.titleWrap, align === 'left' ? { alignItems: 'flex-start' } : null]} onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}>
          {title ? (
            <Txt
              v="title"
              center={align === 'center'}
              numberOfLines={1}
              adjustsFontSizeToFit={Platform.OS !== 'web'}
              minimumFontScale={TITLE_MIN / max}
              accessibilityRole="header"
              style={{ fontSize, lineHeight: Math.round(fontSize * 1.22) }}
            >
              {title}
            </Txt>
          ) : null}
        </View>
        <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
      {subtitle ? (
        <Txt v="bodyLg" color={colors.textSoft} center style={{ marginTop: 2, paddingHorizontal: 20, fontSize: 18.5, lineHeight: 25 }}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

const SIDE = 50;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 46 },
  side: { width: SIDE, justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

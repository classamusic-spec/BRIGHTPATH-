import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { useMotionLevel } from '@/lib/motion';
import { colors, GUTTER } from '@/theme';

import { Tap } from './Tap';
import { Txt } from './Txt';

/** Bottom sheet used for My Tools, details, pickers and confirmations. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 0.86,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: number;
}) {
  const insets = useSafeAreaInsets();
  const level = useMotionLevel();
  const [mounted, setMounted] = useState(visible);
  // Mount as soon as the sheet opens; with motion off there is no exit
  // animation, so it unmounts straight away (state derived during render).
  if (visible && !mounted) setMounted(true);
  if (!visible && mounted && level === 'off') setMounted(false);
  const y = useSharedValue(1);
  useEffect(() => {
    if (visible) {
      y.value = level === 'off' ? 0 : withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (level === 'off') {
      y.value = 1;
    } else {
      y.value = withTiming(1, { duration: 220 }, (f) => {
        if (f) runOnJS(setMounted)(false);
      });
    }
  }, [visible, level, y]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * 600 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: 1 - y.value }));
  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 6, maxHeight: `${maxHeight * 100}%` }, panel]}
          accessibilityViewIsModal
        >
          <View style={styles.grip} />
          {title ? (
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Txt v="titleSm" accessibilityRole="header">
                  {title}
                </Txt>
                {subtitle ? (
                  <Txt v="body" color={colors.textSoft} style={{ marginTop: 2 }}>
                    {subtitle}
                  </Txt>
                ) : null}
              </View>
              <Tap onPress={onClose} accessibilityLabel="Close" style={styles.close}>
                <Icon name="close" size={22} color={colors.text} />
              </Tap>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 6 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F7FAFE',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
  },
  grip: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D3DCEE', marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: GUTTER, paddingBottom: 12, gap: 12 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8EEF9', alignItems: 'center', justifyContent: 'center' },
});

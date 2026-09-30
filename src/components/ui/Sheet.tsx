import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { useMotionLevel } from '@/lib/motion';
import { colors, GUTTER } from '@/theme';
import { easings, springs } from '@/theme/motion';

import { Tap } from './Tap';
import { Txt } from './Txt';

// The browser moves content for the on-screen keyboard itself; Reanimated's keyboard hook is native-only.
function useWebKeyboardHeight(): SharedValue<number> {
  return useSharedValue(0);
}
function useNativeKeyboardHeight(): SharedValue<number> {
  return useAnimatedKeyboard().height;
}
const useKeyboardHeight = Platform.OS === 'web' ? useWebKeyboardHeight : useNativeKeyboardHeight;

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
  // y: 0 open → 1 closed, in units of the panel's own height; drag: finger offset in px.
  const y = useSharedValue(1);
  const drag = useSharedValue(0);
  const h = useSharedValue(800);
  const kbH = useKeyboardHeight();
  useEffect(() => {
    drag.set(0);
    if (visible) {
      y.set(level === 'off' ? 0 : withTiming(0, { duration: 280, easing: easings.out }));
    } else if (level === 'off') {
      y.set(1);
    } else {
      y.set(
        withTiming(1, { duration: 220, easing: easings.in }, (f) => {
          if (f) runOnJS(setMounted)(false);
        }),
      );
    }
  }, [visible, level, y, drag]);
  const off = level === 'off';
  const pan = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      drag.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (drag.value > 90 || e.velocityY > 800) {
        // Hand the dragged distance to y so the close animation continues from the finger.
        y.set(Math.min(1, drag.value / (h.value + 40)));
        drag.set(0);
        runOnJS(onClose)();
      } else {
        drag.set(off ? 0 : withSpring(0, springs.settle));
      }
    });
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * (h.value + 40) + drag.value - kbH.value }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - y.value - drag.value / (h.value + 40)) }));
  const kbUp = useAnimatedStyle(() => (kbH.value > 0 ? { paddingBottom: 12 } : {}));
  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 6, maxHeight: `${maxHeight * 100}%` }, kbUp, panel]}
          onLayout={(e) => {
            h.set(e.nativeEvent.layout.height);
          }}
          accessibilityViewIsModal
        >
          <GestureDetector gesture={pan}>
            <View>
              <View style={styles.gripZone}>
                <View style={styles.grip} />
              </View>
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
            </View>
          </GestureDetector>
          <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 6 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </GestureHandlerRootView>
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
  },
  gripZone: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  grip: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#D3DCEE' },
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: GUTTER, paddingBottom: 12, gap: 12 },
  close: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EEF9', alignItems: 'center', justifyContent: 'center', marginTop: -4 },
});

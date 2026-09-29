import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { SunMark } from '@/components/kid/Brand';
import { Landscape, LANDSCAPES } from '@/components/scenery/Landscape';
import { BackButton, FitBox, Tap, Txt } from '@/components/ui';
import { selectHaptic, successHaptic } from '@/lib/feedback';
import { colors, radius, shadows } from '@/theme';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function makeChallenge(): number[] {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
}

/**
 * 21 · Parent Gate — numbers are shown as words so pre-readers are gently
 * kept in the child space. Not a security boundary; a grown-up doorway.
 */
export default function ParentGate() {
  const insets = useSafeAreaInsets();
  const [challenge, setChallenge] = useState(makeChallenge);
  const [entry, setEntry] = useState<number[]>([]);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const prompt = useMemo(() => challenge.map((d) => WORDS[d]).join(' · '), [challenge]);

  const press = (d: number) => {
    selectHaptic();
    const next = [...entry, d].slice(0, 3);
    setEntry(next);
    if (next.length === 3) {
      if (next.every((x, i) => x === challenge[i])) {
        successHaptic();
        setTimeout(() => router.replace('/coach'), 150);
      } else {
        shake.set(withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }), withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 })));
        setTimeout(() => {
          setEntry([]);
          setChallenge(makeChallenge());
        }, 350);
      }
    }
  };

  const keys: (number | 'back' | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape spec={LANDSCAPES.gate} style={StyleSheet.absoluteFill} />
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 12 }}>
        <BackButton />
      </View>
      <View style={styles.top}>
        <SunMark size={120} />
        <Txt v="display" center style={{ fontSize: 36, lineHeight: 40 }} accessibilityRole="header">
          {'Welcome to\nBrightPath!'}
        </Txt>
        <Txt v="heading" center color={colors.cobalt} style={{ marginTop: 10, fontSize: 21 }}>
          For Parents & Caregivers
        </Txt>
        <Txt v="body" center color={colors.textSoft} style={{ fontSize: 17 }}>
          {'Please enter the numbers\nto continue.'}
        </Txt>
        <Animated.View style={[styles.prompt, shakeStyle]} accessibilityLiveRegion="polite">
          <Txt v="label" color={colors.ink} style={{ fontSize: 17, letterSpacing: 0.5 }}>
            {prompt}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 10 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.pip, i < entry.length ? { backgroundColor: colors.primary } : null]} />
            ))}
          </View>
        </Animated.View>
      </View>
      <FitBox style={styles.foxWrap} aspect={0.86} max={300} min={0}>
        {(size) => (size >= 90 ? <Fox pose="wave" size={size} /> : null)}
      </FitBox>
      <View style={[styles.pad, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        {keys.map((k, i) => (
          <View key={i} style={styles.keyCell}>
            {k === null ? null : k === 'back' ? (
              <Tap onPress={() => setEntry((e) => e.slice(0, -1))} style={[styles.key, { backgroundColor: 'transparent' }]} accessibilityLabel="Delete">
                <Icon name="backspace" size={34} color={colors.cobalt} />
              </Tap>
            ) : (
              <Tap onPress={() => press(k)} style={styles.key} accessibilityLabel={String(k)} scale={0.93}>
                <Txt v="title" color={colors.cobalt} style={{ fontSize: 30, fontFamily: 'Nunito_700Bold' }}>
                  {String(k)}
                </Txt>
              </Tap>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', marginTop: -26 },
  prompt: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginTop: 10 },
  pip: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D5DEEF' },
  foxWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(233, 243, 253, 0.94)', borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: 14, paddingTop: 14, ...shadows.card },
  keyCell: { width: '33.33%', padding: 6 },
  key: { height: 62, borderRadius: radius.lg, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
});

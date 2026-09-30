import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Callout, FeelingFace, FEELINGS, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { sessionEffects } from '@/engine/readiness';
import type { Feeling, Readiness } from '@/engine/types';
import { successHaptic } from '@/lib/feedback';
import { playSound } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { colors, radius, tones } from '@/theme';

/** 03 · Readiness Check — a request about how the session should feel, never a diagnosis. */
export default function CheckIn() {
  const checkIn = useApp((s) => s.checkIn);
  const resetSession = useApp((s) => s.resetSession);
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [picked, setPicked] = useState<Feeling | null>(null);

  useEffect(() => {
    speak('How are you feeling today? Choose what feels closest.');
  }, []);

  // Tapping a face only selects it, so a mis-tap never commits.
  const select = (f: Feeling) => {
    setPicked(f);
    playSound('tap', 0.4);
  };

  const confirm = () => {
    if (!picked) return;
    const r = checkIn(picked);
    const fx = sessionEffects(r);
    speak(fx.message);
    if (fx.offerBreak) {
      setReadiness(r);
    } else {
      successHaptic();
      setTimeout(() => router.replace('/kid/home'), 450);
    }
  };

  const fx = readiness ? sessionEffects(readiness) : null;

  return (
    <Screen
      contentStyle={{ paddingTop: compact ? 8 : 20 }}
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            kind="soft"
            title="Not now"
            accessibilityHint="Skip the check-in"
            onPress={() => {
              resetSession();
              router.replace('/kid/home');
            }}
            style={{ flex: 1 }}
          />
          <Button title="That’s me" disabled={!picked} onPress={confirm} style={{ flex: 1.4 }} />
        </View>
      }
    >
      <Txt v="title" center style={{ fontSize: compact ? 27 : 30, lineHeight: compact ? 32 : 36 }} accessibilityRole="header">
        {'How are you\nfeeling today?'}
      </Txt>
      <Txt v="bodyLg" center color={colors.textSoft} style={{ marginTop: compact ? 4 : 8, fontSize: compact ? 17 : 19, lineHeight: compact ? 22 : 25 }}>
        {'It’s okay to feel different.\nChoose what feels closest.'}
      </Txt>
      <View style={[styles.grid, compact ? { rowGap: 10, marginTop: 14 } : null]} accessibilityRole="radiogroup" accessibilityLabel="How are you feeling today?">
        {FEELINGS.map((f, i) => {
          const on = picked === f.key;
          return (
            <Appear key={f.key} delay={60 * i} style={styles.cell}>
              <Tap
                onPress={() => select(f.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={f.label}
                scale={0.94}
                style={[styles.tile, { backgroundColor: tones[f.tone].bg }, compact ? { paddingVertical: 12 } : null, on ? { borderColor: tones[f.tone].deep } : null]}
              >
                <FeelingFace feeling={f.key} size={compact ? 64 : 84} delay={i * 180} />
                <Txt v="heading" center color={f.key === 'worried' ? '#B3223F' : colors.text} style={{ marginTop: compact ? 4 : 8, fontSize: compact ? 18 : 20 }}>
                  {f.label}
                </Txt>
              </Tap>
            </Appear>
          );
        })}
      </View>
      <Appear delay={400}>
        <Callout tone="white" art={<Icon name="sprout" size={compact ? 36 : 46} />} text="All feelings are welcome here." textSize={compact ? 16 : 18} style={{ marginTop: compact ? 12 : 18, paddingVertical: compact ? 12 : 20 }} />
      </Appear>

      <Sheet visible={!!fx} onClose={() => setReadiness(null)}>
        {fx && (
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <Fox pose={readiness === 'needBreak' ? 'breathe' : 'meditate'} expression="empathy" size={150} />
            <Txt v="heading" center style={{ marginTop: 10 }}>
              Thanks for telling me.
            </Txt>
            <Txt v="bodyLg" center color={colors.textSoft} style={{ marginTop: 4, marginBottom: 16 }}>
              {fx.message}
            </Txt>
            <View style={{ alignSelf: 'stretch', gap: 12 }}>
              <Button
                title="Visit Calm Space"
                onPress={() => {
                  setReadiness(null);
                  router.replace('/kid/home');
                  router.push('/kid/calm');
                }}
              />
              <Button
                kind="soft"
                title="Go slow and play"
                onPress={() => {
                  setReadiness(null);
                  router.replace('/kid/home');
                }}
              />
              <Button
                kind="ghost"
                title="All done for now"
                onPress={() => {
                  setReadiness(null);
                  router.replace({ pathname: '/kid/done', params: { from: 'checkin' } });
                }}
              />
            </View>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: 22 },
  cell: { width: '48%' },
  tile: { borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderWidth: 3, borderColor: 'transparent' },
});

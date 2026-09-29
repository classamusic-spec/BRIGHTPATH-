import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Callout, FeelingFace, FEELINGS, Header, Screen, Sheet, Tap, Txt } from '@/components/ui';
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
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [picked, setPicked] = useState<Feeling | null>(null);

  const choose = (f: Feeling) => {
    setPicked(f);
    playSound('tap', 0.4);
    const r = checkIn(f);
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
    <Screen header={<Header back={false} title="" />} contentStyle={{ paddingTop: 0 }}>
      <Txt v="title" center style={{ fontSize: 30, lineHeight: 36 }} accessibilityRole="header">
        {'How are you\nfeeling today?'}
      </Txt>
      <Txt v="bodyLg" center color={colors.textSoft} style={{ marginTop: 8, fontSize: 19, lineHeight: 25 }}>
        {'It’s okay to feel different.\nChoose what feels closest.'}
      </Txt>
      <View style={styles.grid}>
        {FEELINGS.map((f, i) => {
          const on = picked === f.key;
          return (
            <Appear key={f.key} delay={60 * i} style={styles.cell}>
              <Tap
                onPress={() => choose(f.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={f.label}
                scale={0.94}
                style={[styles.tile, { backgroundColor: tones[f.tone].bg }, on ? { borderColor: tones[f.tone].deep } : null]}
              >
                <FeelingFace feeling={f.key} size={84} delay={i * 180} />
                <Txt v="heading" center color={f.key === 'worried' ? '#B3223F' : colors.text} style={{ marginTop: 8, fontSize: 20 }}>
                  {f.label}
                </Txt>
              </Tap>
            </Appear>
          );
        })}
      </View>
      <Appear delay={400}>
        <Callout tone="white" art={<Icon name="sprout" size={46} />} text="All feelings are welcome here." style={{ marginTop: 18, paddingVertical: 20 }} />
        <Tap onPress={() => router.replace('/kid/home')} accessibilityLabel="Not now, skip the check-in" style={{ alignSelf: 'center', padding: 12 }}>
          <Txt v="label" color={colors.textMuted}>
            Not now
          </Txt>
        </Tap>
      </Appear>

      <Sheet visible={!!fx} onClose={() => setReadiness(null)}>
        {fx && (
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <Fox pose={readiness === 'needBreak' ? 'sleep' : 'meditate'} size={150} />
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
                  router.replace('/kid/done');
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

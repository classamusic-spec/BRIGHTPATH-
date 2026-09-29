import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BUDDIES, BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Button, CheckBadge, Header, Screen, Tap, Txt } from '@/components/ui';
import type { BuddyId } from '@/engine/types';
import { playSound } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { useApp, useLearner } from '@/store';
import { colors, radius } from '@/theme';

/** 02 · Choose Character */
export default function ChooseBuddy() {
  const learner = useLearner();
  const chooseBuddy = useApp((s) => s.chooseBuddy);
  const [picked, setPicked] = useState<BuddyId>(learner.buddy ?? 'finn');

  return (
    <Screen
      header={<Header title="Choose Your Buddy" subtitle="Pick a friend to explore with!" />}
      contentStyle={{ paddingTop: 18 }}
      footer={
        <Button
          title="Next"
          onPress={() => {
            chooseBuddy(picked);
            router.push('/kid/checkin');
          }}
        />
      }
    >
      <View style={styles.grid}>
        {BUDDIES.map((b, i) => {
          const on = b.id === picked;
          return (
            <Appear key={b.id} delay={80 * i} style={styles.cell}>
              <Tap
                onPress={() => {
                  setPicked(b.id);
                  playSound('sparkle', 0.35);
                  speak(`${b.name}. ${b.line}`);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${b.name}. ${b.line}`}
                scale={0.95}
              >
                <View style={[styles.tile, { backgroundColor: b.bg }, on ? styles.tileOn : null]}>
                  <BuddyPortrait id={b.id} size={150} motion={on ? undefined : 'gentle'} />
                </View>
                {on ? <CheckBadge size={34} style={styles.check} /> : null}
                <Txt v="heading" center color={colors.ink} style={{ marginTop: 10, fontSize: 22 }}>
                  {b.name}
                </Txt>
              </Tap>
            </Appear>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22, paddingTop: 12 },
  cell: { width: '47%' },
  tile: { aspectRatio: 1, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  tileOn: { borderColor: colors.primary },
  check: { position: 'absolute', top: -10, right: -8 },
});

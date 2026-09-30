import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, FitBox, Header, Txt } from '@/components/ui';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';
import { colors, GUTTER, radius, shadows } from '@/theme';

const TILES: { icon: IconName; label: string }[] = [
  { icon: 'heart', label: 'Be Kind' },
  { icon: 'sprout', label: 'Be Proud' },
  { icon: 'star', label: 'Tomorrow' },
];

/** 20 · Transition Screen — an explicit, calm "All Done". */
export default function AllDone() {
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  // Arrived by choosing to rest (check-in or My Tools), not by finishing a mission.
  const resting = from === 'checkin' || from === 'tools';
  const heading = resting ? 'Resting is a great choice. See you next time!' : 'You made progress today!';
  useEffect(() => {
    // Stopping mid-quest sets the run aside; it is never marked as a failure.
    const runId = useMission.getState().runId;
    if (runId) {
      useApp.getState().abandonRun(runId);
      useMission.getState().end();
    }
    speak(resting ? `All done for now! ${heading}` : 'All done for now! You made progress today.');
  }, [resting, heading]);
  const home = <Button kind={resting ? 'soft' : 'primary'} title="Back to Home" onPress={() => router.dismissTo('/kid/home')} style={resting ? { marginTop: 10 } : undefined} />;
  const rest = <Button kind={resting ? 'primary' : 'soft'} title="Take a Break" onPress={() => router.push('/kid/calm')} style={resting ? undefined : { marginTop: 10 }} />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape
        style={StyleSheet.absoluteFill}
        spec={{
          horizon: 0.38,
          ground: 0.46,
          sun: { x: 0.86, y: 0.14, r: 90, cloud: true },
          clouds: [{ x: 0.3, y: 0.2, s: 0.95 }],
          trees: [
            { x: 0.1, base: 0.5, h: 110 },
            { x: 0.22, base: 0.44, h: 56, tone: 'light' },
            { x: 0.78, base: 0.46, h: 80, tone: 'light' },
            { x: 0.92, base: 0.5, h: 160 },
          ],
          bushes: [
            { x: 0.1, base: 0.6, s: 1.3, tone: 'deep' },
            { x: 0.9, base: 0.6, s: 1.3, tone: 'deep' },
          ],
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <Header title="All Done for Now!" onBack={() => router.dismissTo('/kid/home')} />
      </View>
      <FitBox style={styles.hero} aspect={270 / 170} max={230} min={90}>
        {(size) => <Fox pose="sleep" size={size} />}
      </FitBox>
      <Appear style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <Txt v="heading" center color={colors.text} style={{ fontSize: 24, fontFamily: 'Nunito_700Bold' }}>
          {heading}
        </Txt>
        <View style={styles.tiles}>
          {TILES.map((t, i) => (
            <Appear key={t.label} delay={150 + i * 100} from="zoom" style={styles.tile}>
              <Icon name={t.icon} size={58} />
              <Txt v="subheading" center color={colors.text} style={{ marginTop: 8, fontSize: 19, fontFamily: 'Nunito_700Bold' }}>
                {t.label}
              </Txt>
            </Appear>
          ))}
        </View>
        {resting ? rest : home}
        {resting ? home : rest}
        <View style={styles.rest}>
          <Icon name="sprout" size={44} />
          <Txt v="bodyLg" color={colors.text} style={{ fontSize: 19 }}>
            Rest helps you grow!
          </Txt>
        </View>
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 90 },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 10, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: GUTTER, paddingTop: 20, ...shadows.card },
  tiles: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  tile: { flex: 1, backgroundColor: '#EEF4FD', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 16 },
  rest: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
});

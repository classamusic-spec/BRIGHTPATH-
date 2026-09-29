import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, Header, Txt } from '@/components/ui';
import { speak } from '@/lib/speech';
import { colors, GUTTER, radius, shadows } from '@/theme';

const TILES: { icon: IconName; label: string }[] = [
  { icon: 'heart', label: 'Be Kind' },
  { icon: 'sprout', label: 'Be Proud' },
  { icon: 'star', label: 'Tomorrow' },
];

/** 20 · Transition Screen — an explicit, calm "All Done". */
export default function AllDone() {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    speak('All done for now! You made progress today.');
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape
        style={StyleSheet.absoluteFill}
        spec={{
          horizon: 0.38,
          ground: 0.46,
          sun: { x: 0.72, y: 0.23, r: 110, cloud: true },
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
      <View style={styles.hero}>
        <Fox pose="sleep" size={200} />
      </View>
      <Appear style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <Txt v="heading" center color={colors.text} style={{ fontSize: 24, fontFamily: 'Nunito_700Bold' }}>
          You made progress today!
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
        <Button title="Back to Home" onPress={() => router.dismissTo('/kid/home')} />
        <Button kind="soft" title="Take a Break" onPress={() => router.push('/kid/calm')} style={{ marginTop: 10 }} />
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
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 160 },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 10, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: GUTTER, paddingTop: 20, ...shadows.card },
  tiles: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  tile: { flex: 1, backgroundColor: '#EEF4FD', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 16 },
  rest: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
});

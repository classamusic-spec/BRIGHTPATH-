import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { BrandBlock } from '@/components/kid/Brand';
import { Landscape, LANDSCAPES } from '@/components/scenery/Landscape';
import { Appear, Button, FitBox, Txt } from '@/components/ui';
import { GUIDE } from '@/content/cast';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { colors, GUTTER } from '@/theme';

/** 01 · Splash */
export default function Splash() {
  const insets = useSafeAreaInsets();
  const onboarded = useApp((s) => s.onboarded);
  const go = () => router.push(onboarded ? '/kid/checkin' : '/kid/buddy');
  return (
    <View style={styles.root}>
      <Landscape spec={LANDSCAPES.splash} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + 18, paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
        <Appear from="up">
          <BrandBlock />
        </Appear>
        <FitBox style={styles.hero} aspect={0.86} max={390} min={220}>
          {(size) => (
            <Fox pose="wave" size={size} onPress={() => speak(`Hi! I’m ${GUIDE.name}. Let’s play, practice and feel good together!`)} accessibilityLabel={`${GUIDE.name} the fox waving hello. Tap to say hi.`} />
          )}
        </FitBox>
        <Appear delay={250}>
          <Txt v="bodyLg" center color="#1C2F57" style={{ fontSize: 22, lineHeight: 28, marginBottom: 16 }}>
            {'A kinder, braver, brighter\nyou is possible.'}
          </Txt>
          <Button title="Let’s Go!" onPress={go} />
        </Appear>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: GUTTER + 4 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4, marginTop: 8, marginHorizontal: -24 },
});

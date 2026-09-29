import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, Header, IconTile, TwinkleStar, Txt } from '@/components/ui';
import type { MissionStep } from '@/content/types';
import { speak } from '@/lib/speech';
import { colors, GUTTER, radius, shadows } from '@/theme';

import type { StepProps } from './context';

/** 11 · Mission Detail */
export function StepDetail({ step, next }: StepProps<Extract<MissionStep, { type: 'detail' }>>) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Landscape
        style={StyleSheet.absoluteFill}
        spec={{
          horizon: 0.3,
          ground: 0.4,
          clouds: [
            { x: 0.1, y: 0.13, s: 0.6 },
            { x: 0.9, y: 0.16, s: 0.7 },
          ],
          trees: [
            { x: 0.08, base: 0.46, h: 120 },
            { x: 0.72, base: 0.4, h: 90, tone: 'light' },
            { x: 0.86, base: 0.42, h: 140 },
          ],
          bushes: [{ x: 0.82, base: 0.48, s: 1.1, tone: 'deep' }],
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <Header title={step.header} right={<MyToolsButton />} />
      </View>
      <View style={styles.hero}>
        <Fox pose="wave" size={250} onPress={() => speak(`${step.title}. ${step.body}`, { force: true })} />
        <TwinkleStar size={44} style={{ top: 6, left: '66%' }} delay={300} />
      </View>
      <Appear style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <Txt v="title" style={{ fontSize: 30, lineHeight: 36 }}>
          {step.title}
        </Txt>
        <Txt v="bodyLg" color={colors.text} style={{ fontSize: 20, lineHeight: 27, marginTop: 4 }}>
          {step.body}
        </Txt>
        <View style={{ gap: 10, marginTop: 14, marginBottom: 16 }}>
          {step.points.map((pt, i) => (
            <Appear key={pt.title} delay={120 + i * 90} style={styles.point}>
              <IconTile tone={pt.tone} size={64} radiusPx={18}>
                <Icon name={pt.icon} size={40} />
              </IconTile>
              <View style={styles.pointText}>
                <Txt v="subheading" color={colors.ink} style={{ fontSize: 18 }}>
                  {pt.title}
                </Txt>
                <Txt v="bodySm" color={colors.textSoft} style={{ fontSize: 15 }}>
                  {pt.sub}
                </Txt>
              </View>
            </Appear>
          ))}
        </View>
        <Button title={step.cta} onPress={next} />
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 200 },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: GUTTER,
    paddingTop: 22,
    ...shadows.card,
  },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointText: { flex: 1, backgroundColor: '#F2F6FD', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
});

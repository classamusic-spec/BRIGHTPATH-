import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { SCENE_ASPECT, SCENE_TOP, StoryScene } from '@/components/scenery/Scenes';
import { Appear, BackButton, Button, Canvas, Header, ProgressBar, Tap, Txt } from '@/components/ui';
import type { MissionStep } from '@/content/types';
import { speak } from '@/lib/speech';
import { colors, GUTTER, radius, shadows } from '@/theme';

import type { StepProps } from './context';

function ReadAloud({ text, inline = false }: { text: string; inline?: boolean }) {
  return (
    <Tap onPress={() => speak(text, { force: true })} accessibilityLabel="Read this to me" style={inline ? styles.speakerInline : styles.speaker} hitSlop={8}>
      <Icon name="speaker" size={22} color={colors.primary} />
    </Tap>
  );
}

/** 06 · In-Game Scenario */
export function StepScenario({ step, next }: StepProps<Extract<MissionStep, { type: 'scenario' }>>) {
  const insets = useSafeAreaInsets();
  // The scene keeps its authored proportions and sits just above the text
  // card (tucked 34pt behind it); taller screens extend the wall/sky colour.
  const [cardSpace, setCardSpace] = useState(0);
  useEffect(() => {
    speak(step.text);
  }, [step.text]);
  return (
    <View style={styles.root}>
      <Canvas />
      <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <ProgressBar value={step.round / step.rounds} color="#43BE76" height={22} track="#D5E3F3" />
        </View>
        <View style={styles.count}>
          <Txt v="label" color={colors.ink} style={{ fontSize: 17 }}>
            {`${step.round}/${step.rounds}`}
          </Txt>
        </View>
        <View style={{ marginLeft: 8 }}>
          <MyToolsButton />
        </View>
      </View>
      <View style={[styles.sceneWrap, { backgroundColor: SCENE_TOP[step.scene] }]}>
        <StoryScene scene={step.scene} style={[styles.scene, { bottom: Math.max(0, cardSpace - 34), aspectRatio: SCENE_ASPECT[step.scene] }]} />
        <View onLayout={(e) => setCardSpace(e.nativeEvent.layout.height)} style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Appear style={styles.textCard}>
            <Txt v="heading" center color="#12248C" style={{ fontSize: 24, lineHeight: 32, fontFamily: 'Nunito_700Bold' }}>
              {step.text}
            </Txt>
            <View style={styles.cardActions}>
              <ReadAloud text={step.text} inline />
            </View>
            <Button title={step.cta} size="md" onPress={next} style={{ marginTop: 14, alignSelf: 'center', paddingHorizontal: 40 }} />
          </Appear>
        </View>
      </View>
    </View>
  );
}

/** 13 · Story Scenario */
export function StepStory({ step, next }: StepProps<Extract<MissionStep, { type: 'story' }>>) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    speak(step.text);
  }, [step.text]);
  return (
    <View style={styles.root}>
      <Canvas />
      <View style={{ paddingTop: insets.top }}>
        <Header title={step.title} subtitle={step.subtitle} right={<MyToolsButton />} />
      </View>
      <View style={{ flex: 1, backgroundColor: SCENE_TOP[step.scene], justifyContent: 'flex-end', overflow: 'hidden' }}>
        <StoryScene scene={step.scene} style={{ width: '118%', alignSelf: 'center', aspectRatio: SCENE_ASPECT[step.scene] }} />
      </View>
      <Appear style={[styles.storyCard, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <ReadAloud text={step.text} />
        <Txt v="bodyLg" color={colors.text} style={{ fontSize: 20, lineHeight: 28, paddingRight: 28 }}>
          {step.text}
        </Txt>
        <View style={styles.hint}>
          <Txt v="bodyLg" center color={colors.text} style={{ fontSize: 19, lineHeight: 25 }}>
            {step.hint}
          </Txt>
        </View>
        <Button title={step.cta} onPress={next} />
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12 },
  count: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 12, height: 40, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  sceneWrap: { flex: 1, marginHorizontal: 10, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'flex-end' },
  // Slightly wider than the frame: a gentle zoom that keeps the action big.
  scene: { position: 'absolute', left: '-8%', right: '-8%' },
  textCard: {
    marginHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 20,
    ...shadows.card,
  },
  storyCard: {
    marginTop: -18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: GUTTER,
    paddingTop: 20,
    gap: 14,
    ...shadows.card,
  },
  hint: { backgroundColor: '#E6F0FD', borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 12 },
  cardActions: { position: 'absolute', right: 10, top: -20 },
  speakerInline: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  speaker: { position: 'absolute', right: 10, top: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
});

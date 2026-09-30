import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MyToolsButton } from '@/components/kid/MyTools';
import { SCENE } from '@/components/scenery/elements';
import { SCENE_ASPECT, SCENE_TOP, StoryScene } from '@/components/scenery/Scenes';
import { Appear, BackButton, Button, Canvas, Header, ProgressBar, Txt } from '@/components/ui';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import type { MissionStep, SceneId } from '@/content/types';
import { speak } from '@/lib/speech';
import { colors, GUTTER, radius, shadows } from '@/theme';

import type { StepProps } from './context';

/** Floor colour at the bottom edge of each scene, painted behind the text card. */
const SCENE_FLOOR: Record<SceneId, string> = {
  playroom: '#F4D3B4',
  bedroom: '#F9E2C6',
  shelf: '#F4D9BB',
  puzzle: '#F4D9BB',
  playground: SCENE.grass,
  house: SCENE.grass,
  kitchen: '#F4D9BB',
};

/** Largest zoom over the scene's authored width (keeps Pip ≈ 55–65% of the frame). */
const MAX_ZOOM = 1.3;

/** 06 · In-Game Scenario */
export function StepScenario({ step, next }: StepProps<Extract<MissionStep, { type: 'scenario' }>>) {
  const insets = useSafeAreaInsets();
  // The scene fills the frame above the text card and runs under its top
  // half; the band behind the card is painted in the floor colour.
  const [cardSpace, setCardSpace] = useState(0);
  useEffect(() => {
    speak(step.text);
  }, [step.text]);
  // `mood` is threaded through StoryScene by the scenery workstream; spread so older scene typings still compile.
  const moodProps = step.mood ? ({ mood: step.mood } as object) : {};
  const [wrap, setWrap] = useState({ w: 0, h: 0 });
  const sceneBottom = Math.max(0, Math.round(cardSpace * 0.55));
  // Fill the frame (slice, bottom-aligned) but cap the zoom so the character
  // stays about half the frame wide; any taller frame continues the wall colour.
  const sceneH = wrap.w ? Math.min(wrap.h - sceneBottom, (wrap.w * MAX_ZOOM) / SCENE_ASPECT[step.scene]) : 0;
  return (
    <View style={styles.root}>
      <Canvas />
      <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <ProgressBar value={step.round / step.rounds} from={(step.round - 1) / step.rounds} color="#43BE76" height={22} track="#D5E3F3" />
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
      <View style={[styles.sceneWrap, { backgroundColor: SCENE_FLOOR[step.scene] }]} onLayout={(e) => setWrap({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <View style={[styles.sceneFill, { bottom: sceneBottom, backgroundColor: SCENE_TOP[step.scene] }]}>
          {sceneH > 0 ? <StoryScene scene={step.scene} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: sceneH }} {...moodProps} /> : null}
        </View>
        <View onLayout={(e) => setCardSpace(e.nativeEvent.layout.height)} style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Appear style={styles.textCard}>
            <Txt v="heading" center color="#12248C" style={{ fontSize: 24, lineHeight: 32, fontFamily: 'Nunito_700Bold' }}>
              {step.text}
            </Txt>
            <View style={styles.cardActions}>
              <ReadAloudButton text={step.text} />
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
        <ReadAloudButton text={step.text} style={styles.speaker} />
        <Txt v="bodyLg" color={colors.text} style={{ fontSize: 20, lineHeight: 28, paddingRight: 44 }}>
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
  sceneFill: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
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
  cardActions: { position: 'absolute', right: 10, top: -24 },
  speaker: { position: 'absolute', right: 10, top: 10, zIndex: 2, backgroundColor: colors.primarySoft },
});

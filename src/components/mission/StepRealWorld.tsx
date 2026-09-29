import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Landscape } from '@/components/scenery/Landscape';
import { HouseScene } from '@/components/scenery/Scenes';
import { Appear, BackButton, Button, Callout, Header, IconTile, Screen, Tap, Txt } from '@/components/ui';
import type { MissionStep } from '@/content/types';
import { successHaptic } from '@/lib/feedback';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';
import { colors, GUTTER, radius, shadows } from '@/theme';

import { goalForEvidence, type StepProps } from './context';

type RW = Extract<MissionStep, { type: 'realWorld' }>;

/** Finishing a mission: accept (or skip) the quest, then go see the room. */
function useFinish(mission: StepProps<RW>['mission'], step: RW, learnerId: string) {
  const acceptQuest = useApp((s) => s.acceptQuest);
  const earnStars = useApp((s) => s.earnStars);
  const finishMission = useApp((s) => s.finishMission);
  const runId = useMission((s) => s.runId);
  return (accepted: boolean) => {
    if (accepted) {
      successHaptic();
      acceptQuest({
        missionId: mission.id,
        title: step.questTitle,
        quest: step.quest,
        setting: step.setting,
        skillArea: step.evidence.skillArea,
        goalId: goalForEvidence(learnerId, step.evidence)?.id,
      });
      earnStars(1, 'Accepted a Real-World Quest');
    }
    // Missions without a "complete" step award their stars here (never twice).
    if (runId) finishMission(runId);
    const earned = (runId ? mission.stars : 0) + (accepted ? 1 : 0);
    useMission.getState().end();
    router.push({ pathname: '/kid/room', params: { from: 'mission', earned: String(earned) } });
  };
}

/** 09 · Real-World Quest (card) */
function QuestCard({ mission, step, learner }: StepProps<RW>) {
  const insets = useSafeAreaInsets();
  const finish = useFinish(mission, step, learner.id);
  useEffect(() => speak(step.quest), [step.quest]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape style={StyleSheet.absoluteFill} spec={{ horizon: 0.3, ground: 0.34, groundColor: '#BFE89C' }} />
      <HouseScene style={{ height: 280 }} />
      <View style={[styles.floatHeader, { top: insets.top + 6 }]}>
        <BackButton />
        <MyToolsButton />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 14, marginTop: -26, paddingBottom: Math.max(insets.bottom, 12) + 10 }}>
        <Appear style={[styles.card, { flex: 1, justifyContent: 'space-between' }]}>
          <View>
          <View style={styles.row}>
            <Txt v="heading" color={colors.ink} style={{ fontSize: 21 }}>
              {step.questTitle}
            </Txt>
            <View style={styles.tryThis}>
              <Txt v="label" color={colors.tealDeep} style={{ fontSize: 17 }}>
                Try This
              </Txt>
            </View>
          </View>
          <Txt v="title" style={{ fontSize: 34, lineHeight: 42, marginTop: 16 }}>
            {step.quest}
          </Txt>
          </View>
          <View style={[styles.row, { marginTop: 22, justifyContent: 'flex-start', gap: 20 }]}>
            <Icon name="heart" size={84} />
            <Txt v="bodyLg" color={colors.text} style={{ fontSize: 22, lineHeight: 29, flex: 1 }}>
              {step.tip}
            </Txt>
          </View>
          <View>
          <Button title={step.cta} onPress={() => finish(true)} style={{ marginTop: 22, height: 70 }} />
          <Tap onPress={() => finish(false)} style={{ alignSelf: 'center', padding: 10 }} accessibilityLabel="Maybe later">
            <Txt v="label" color={colors.textMuted}>
              Maybe later
            </Txt>
          </Tap>
          </View>
        </Appear>
      </View>
    </View>
  );
}

/** 18 · Real-World Quest (family) */
function QuestFamily({ mission, step, learner }: StepProps<RW>) {
  const finish = useFinish(mission, step, learner.id);
  useEffect(() => speak(`${step.questTitle}. ${step.quest}`), [step.questTitle, step.quest]);
  return (
    <Screen
      padded={false}
      header={<Header title={step.title} right={<MyToolsButton />} />}
      background={<Landscape style={StyleSheet.absoluteFill} spec={{ horizon: 0.2, ground: 0.24, groundColor: '#BFE89C', skyTop: '#EAF4FD', skyBottom: '#F2F9FE' }} />}
    >
      <HouseScene compact style={{ height: 150, marginTop: -6 }} />
      <Appear style={[styles.card, { marginHorizontal: 12, marginTop: -8 }]}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ gap: 10, alignItems: 'center' }}>
            <IconTile tone="sky" size={86} radiusPx={43}>
              <Icon name="house" size={50} color="#E4504E" />
            </IconTile>
            <View style={styles.starDot}>
              <Icon name="star" size={34} color="#FFFFFF" />
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Txt v="title" style={{ fontSize: 27, lineHeight: 33 }}>
              {step.questTitle}
            </Txt>
            <Txt v="bodyLg" color={colors.text} style={{ fontSize: 20, lineHeight: 27, marginTop: 10 }}>
              {step.quest}
            </Txt>
          </View>
        </View>
        {step.example ? (
          <Callout tone="blush" art={<Icon name="heart" size={62} />} text={step.example} style={{ marginTop: 16, paddingVertical: 18 }} />
        ) : null}
        <Callout tone="sky" art={<Fox pose="head" size={84} interactive={false} />} text={step.tip} style={{ marginTop: 12 }} />
        <Button title={step.cta} onPress={() => finish(true)} style={{ marginTop: 16 }} />
        <Tap onPress={() => finish(false)} style={{ alignSelf: 'center', padding: 10 }} accessibilityLabel="Maybe later">
          <Txt v="label" color={colors.textMuted}>
            Maybe later
          </Txt>
        </Tap>
      </Appear>
    </Screen>
  );
}

export function StepRealWorld(props: StepProps<RW>) {
  return props.step.variant === 'family' ? <QuestFamily {...props} /> : <QuestCard {...props} />;
}

const styles = StyleSheet.create({
  floatHeader: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: radius.xxl, padding: GUTTER, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tryThis: { backgroundColor: '#D6F3EC', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  starDot: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
});

import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Landscape } from '@/components/scenery/Landscape';
import { HouseScene } from '@/components/scenery/Scenes';
import { Appear, BackButton, Button, Callout, Header, IconTile, Screen, Txt } from '@/components/ui';
import { ROOM_ITEMS } from '@/content/rewards';
import type { MissionStep } from '@/content/types';
import { successHaptic } from '@/lib/feedback';
import { fitFontSize } from '@/lib/fitText';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';
import { colors, fonts, GUTTER, radius, shadows } from '@/theme';

import { goalForEvidence, type StepProps } from './context';

type RW = Extract<MissionStep, { type: 'realWorld' }>;

/** Finishing a mission: accept (or skip) the quest, then go see the room. Runs once per play. */
function useFinish(mission: StepProps<RW>['mission'], step: RW, learnerId: string) {
  const runId = useMission((s) => s.runId);
  const finishedRef = useRef(false);
  return (accepted: boolean) => {
    if (!runId || finishedRef.current) return;
    const app = useApp.getState();
    const run = app.runs.find((r) => r.id === runId);
    if (!run) return;
    finishedRef.current = true;
    let gained = 0;
    if (accepted) {
      successHaptic();
      // acceptQuest ignores repeats for the same run; the quest star follows it.
      const already = app.quests.some((q) => q.runId === runId);
      app.acceptQuest({
        missionId: mission.id,
        title: step.questTitle,
        quest: step.quest,
        setting: step.setting,
        skillArea: step.evidence.skillArea,
        goalId: goalForEvidence(learnerId, step.evidence)?.id,
        runId,
      });
      if (!already) {
        app.earnStars(1, 'Accepted a Real-World Quest');
        gained += 1;
      }
    }
    // Missions with a "complete" step were finished there; the rest finish here (never twice).
    const result = run.completedAt ? (useMission.getState().awarded ?? { stars: 0 }) : app.finishMission(runId);
    gained += result.stars;
    const total = (useApp.getState().rewards[learnerId]?.stars ?? 0);
    const unlocked = ROOM_ITEMS.filter((it) => it.unlockAt > total - gained && it.unlockAt <= total).map((it) => it.id);
    router.dismissTo('/kid/home');
    router.push({ pathname: '/kid/room', params: { from: 'mission', gained: String(gained), earned: String(gained), unlocked: unlocked.join(','), badge: result.badge ?? '' } });
    useMission.getState().end();
  };
}

/** 09 · Real-World Quest (card) */
function QuestCard({ mission, step, learner }: StepProps<RW>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const finish = useFinish(mission, step, learner.id);
  useEffect(() => speak(step.quest), [step.quest]);
  const sceneH = Math.min(280, Math.max(150, height * 0.26));
  // Card inner width ≈ window − outer padding (28) − card padding; aim for ≤ 3 lines.
  const titleSize = fitFontSize(step.quest, fonts.black, 34, 26, (width - 28 - 2 * GUTTER) * 2.6);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape style={StyleSheet.absoluteFill} spec={{ horizon: 0.2, ground: 0.24, groundColor: '#BFE89C' }} />
      <HouseScene style={{ height: sceneH }} />
      <View style={[styles.floatHeader, { top: insets.top + 6 }]}>
        <BackButton />
        <MyToolsButton />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 14, marginTop: -26, paddingBottom: Math.max(insets.bottom, 12) + 10 }}>
        <Appear style={[styles.card, { flex: 1, paddingBottom: 14 }]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <View>
              <View style={styles.row}>
                <Txt v="heading" color={colors.ink} style={{ fontSize: 21, flexShrink: 1 }}>
                  {step.questTitle}
                </Txt>
                <View style={styles.tryThis}>
                  <Txt v="label" color={colors.tealDeep} style={{ fontSize: 17 }}>
                    Try This
                  </Txt>
                </View>
              </View>
              <Txt v="title" accessibilityRole="header" style={{ fontSize: titleSize, lineHeight: Math.round(titleSize * 1.24), marginTop: 14 }}>
                {step.quest}
              </Txt>
            </View>
            <View style={[styles.row, { marginTop: 18, justifyContent: 'flex-start', gap: 18 }]}>
              <Icon name="heart" size={Math.round(Math.min(84, sceneH * 0.36))} />
              <Txt v="bodyLg" color={colors.text} style={{ fontSize: 21, lineHeight: 28, flex: 1 }}>
                {step.tip}
              </Txt>
            </View>
          </ScrollView>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button title={step.cta} onPress={() => finish(true)} style={{ height: 62 }} />
            <Button kind="soft" size="md" title="Maybe later" onPress={() => finish(false)} />
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
      footer={
        <View style={{ gap: 10 }}>
          <Button title={step.cta} onPress={() => finish(true)} />
          <Button kind="soft" size="md" title="Maybe later" onPress={() => finish(false)} />
        </View>
      }
      background={<Landscape style={StyleSheet.absoluteFill} spec={{ horizon: 0.2, ground: 0.24, groundColor: '#BFE89C', skyTop: '#EAF4FD', skyBottom: '#F2F9FE' }} />}
    >
      <HouseScene compact style={{ height: 150, marginTop: -6 }} />
      <Appear style={[styles.card, { marginHorizontal: 12, marginTop: -8, marginBottom: 8 }]}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ gap: 10, alignItems: 'center' }}>
            <IconTile tone="sky" size={76} radiusPx={38}>
              <Icon name="house" size={46} color="#E4504E" />
            </IconTile>
            <View style={styles.starDot}>
              <Icon name="star" size={32} color="#FFFFFF" />
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Txt v="title" style={{ fontSize: 25.5, lineHeight: 31 }}>
              {step.questTitle}
            </Txt>
            <Txt v="bodyLg" color={colors.text} style={{ fontSize: 21, lineHeight: 28, marginTop: 8 }}>
              {step.quest}
            </Txt>
          </View>
        </View>
        {step.example ? (
          <Callout tone="blush" art={<Icon name="heart" size={62} />} text={step.example} style={{ marginTop: 16, paddingVertical: 18 }} />
        ) : null}
        <Callout tone="sky" art={<Fox pose="head" size={96} interactive={false} decorative />} text={step.tip} style={{ marginTop: 12 }} />
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
  starDot: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
});

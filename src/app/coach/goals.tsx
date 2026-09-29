import { router } from 'expo-router';
import { View } from 'react-native';

import { AreaIcon, CoachNav } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Card, Header, ProgressBar, Screen, Txt } from '@/components/ui';
import { KIND_LABEL } from '@/engine/decision';
import { useApp } from '@/store';
import { useGoalViews } from '@/store/derived';
import { colors } from '@/theme';

/** Goals (coach tab) — every goal with its explainable next step. */
export default function Goals() {
  const views = useGoalViews();
  const learners = useApp((s) => s.learners);
  const active = views.filter((v) => v.goal.status === 'active');
  const other = views.filter((v) => v.goal.status !== 'active');
  const card = (v: (typeof views)[number]) => {
    const l = learners.find((x) => x.id === v.goal.learnerId);
    return (
      <Appear key={v.goal.id}>
        <Card onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: v.goal.id } })} style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AreaIcon area={v.goal.skillArea} size={44} />
            <View style={{ flex: 1 }}>
              <Txt v="caption" color={colors.textMuted}>
                {l?.fullName ?? l?.displayName}
              </Txt>
              <Txt v="subheading" color={colors.ink}>
                {v.goal.title}
              </Txt>
            </View>
            <Txt v="label" color={colors.mintDeep}>{`${Math.round(v.progress * 100)}%`}</Txt>
          </View>
          <ProgressBar value={v.progress} height={8} style={{ marginTop: 10 }} />
          <Txt v="caption" color={v.rec.kind === 'humanReview' ? '#C23A5C' : colors.textMuted} style={{ marginTop: 6 }}>
            {v.goal.status === 'active' ? `Next: ${KIND_LABEL[v.rec.kind]}` : v.goal.status}
          </Txt>
        </Card>
      </Appear>
    );
  };
  return (
    <Screen header={<Header title="Goals" back={false} />} footer={<CoachNav active="goals" />}>
      <Button title="Create a Growth Goal" icon={<Icon name="plus" size={22} color="#FFFFFF" />} onPress={() => router.push('/coach/goal/new')} style={{ marginBottom: 14 }} />
      <Txt v="subheading" style={{ marginBottom: 8 }}>{`In progress (${active.length})`}</Txt>
      <View style={{ gap: 10 }}>{active.map(card)}</View>
      {other.length ? (
        <>
          <Txt v="subheading" style={{ marginTop: 16, marginBottom: 8 }}>
            Paused, complete or retired
          </Txt>
          <View style={{ gap: 10 }}>{other.map(card)}</View>
        </>
      ) : null}
    </Screen>
  );
}

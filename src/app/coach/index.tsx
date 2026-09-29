import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PersonAvatar, PEOPLE } from '@/components/characters/People';
import { Fox } from '@/components/characters/fox/Fox';
import { CoachNav, StatCard, WeekBars } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Card, Screen, SegmentedTabs, Tap, Txt } from '@/components/ui';
import { recommend, KIND_LABEL } from '@/engine/decision';
import { useApp } from '@/store';
import { useDashboard } from '@/store/derived';
import { colors, GUTTER, radius, shadows } from '@/theme';

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** 22 · Coach Dashboard */
export default function Dashboard() {
  const adultName = useApp((s) => s.adultName);
  const team = useApp((s) => s.team);
  const learners = useApp((s) => s.learners);
  const goals = useApp((s) => s.goals);
  const observations = useApp((s) => s.observations);
  const setActive = useApp((s) => s.setActiveLearner);
  const me = team.find((m) => m.isSelf);
  const ids = useMemo(() => (me ? me.learnerIds : learners.map((l) => l.id)), [me, learners]);
  const stats = useDashboard(ids);
  const [tab, setTab] = useState<'overview' | 'learners' | 'insights'>('overview');

  const openLearner = (id: string) => {
    setActive(id);
    router.push({ pathname: '/coach/learner/[id]', params: { id } });
  };

  const flagged = useMemo(() => {
    const now = new Date();
    return goals
      .filter((g) => g.status === 'active' && ids.includes(g.learnerId))
      .map((g) => ({ g, r: recommend(g, observations.filter((o) => o.goalId === g.id), now) }))
      .filter((x) => ['increaseSupport', 'reassessAccess', 'humanReview', 'reviewGoal', 'gatherEvidence'].includes(x.r.kind));
  }, [goals, observations, ids]);

  return (
    <Screen
      edges={['top']}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 6 }}>
          <Txt v="display" color="#1320C4" style={{ flex: 1, fontSize: 34, lineHeight: 40 }} accessibilityRole="header">
            {`${greeting()},\n${adultName}!`}
          </Txt>
          <Tap onPress={() => router.push('/coach/settings')} accessibilityLabel="Your account" style={{ borderRadius: 48, borderWidth: 4, borderColor: '#DCEBFC' }}>
            <PersonAvatar look={PEOPLE.taylor} size={92} />
          </Tap>
        </View>
      }
      footer={<CoachNav active="home" />}
      contentStyle={{ paddingBottom: 12 }}
    >
      <SegmentedTabs
        items={[
          { key: 'overview', label: 'Overview' },
          { key: 'learners', label: 'Learners' },
          { key: 'insights', label: 'Insights' },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginTop: 8, marginBottom: 14 }}
      />

      {tab === 'overview' && (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard icon={<Icon name="people" size={60} />} value={String(stats.learners)} label="Learners" onPress={() => router.replace('/coach/learners')} />
            <StatCard icon={<Icon name="sprout" size={60} />} value={String(stats.goalsInProgress)} label={'Goals in\nProgress'} onPress={() => router.replace('/coach/goals')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <StatCard icon={<Icon name="heart" size={60} />} value={String(stats.needSupport.length)} valueColor="#E0264F" label="Need Support" onPress={() => setTab('insights')} />
            <StatCard icon={<Icon name="star" size={60} />} value={String(stats.celebrations)} valueColor={colors.mintDeep} label="Celebrations" />
          </View>
          <Appear delay={100}>
            <Card style={{ marginTop: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Txt v="heading" color={colors.cobalt} style={{ fontSize: 23 }}>
                  This Week
                </Txt>
                <Tap onPress={() => openLearner(ids[0])} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel="View all activity">
                  <Txt v="label" color={colors.cobalt} style={{ fontSize: 17 }}>
                    View All
                  </Txt>
                  <Icon name="chevronRight" size={20} color={colors.cobalt} />
                </Tap>
              </View>
              <WeekBars days={stats.days} height={140} />
            </Card>
          </Appear>
          <Appear delay={180}>
            <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingRight: 16 }}>
              <View style={{ width: 118, height: 112, justifyContent: 'flex-end' }}>
                <Fox pose="bust" size={118} wavePaw />
              </View>
              <Txt v="heading" color={colors.cobalt} style={{ flex: 1, fontSize: 22, lineHeight: 29, fontFamily: 'Nunito_700Bold', fontStyle: 'italic' }}>
                “Small steps make big change.”
              </Txt>
            </Card>
          </Appear>
        </>
      )}

      {tab === 'learners' && (
        <View style={{ gap: 10 }}>
          {learners
            .filter((l) => ids.includes(l.id))
            .map((l, i) => {
              const needs = stats.needSupport.includes(l.id);
              return (
                <Appear key={l.id} delay={i * 30}>
                  <Card onPress={() => openLearner(l.id)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }} accessibilityLabel={`${l.fullName ?? l.displayName}${needs ? ', could use extra support' : ''}`}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5F0FD', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                      <BuddyPortrait id={l.buddy} size={60} motion="off" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt v="subheading" color={colors.ink}>
                        {l.fullName ?? l.displayName}
                      </Txt>
                      <Txt v="bodySm" color={colors.textMuted}>
                        {[l.age ? `${l.age} years old` : null, l.grade].filter(Boolean).join(' • ')}
                      </Txt>
                    </View>
                    {needs ? (
                      <View style={{ backgroundColor: colors.blushSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Txt v="caption" color="#C23A5C">
                          Extra support
                        </Txt>
                      </View>
                    ) : null}
                    <Icon name="chevronRight" size={20} color={colors.cobalt} />
                  </Card>
                </Appear>
              );
            })}
        </View>
      )}

      {tab === 'insights' && (
        <View style={{ gap: 10 }}>
          <Txt v="body" color={colors.textSoft}>
            Goals where BrightPath suggests a closer look. Each suggestion explains why — nothing changes automatically when a human review is needed.
          </Txt>
          {flagged.length === 0 ? (
            <Card style={{ padding: 16 }}>
              <Txt v="body">Nothing needs attention right now.</Txt>
            </Card>
          ) : (
            flagged.map(({ g, r }) => {
              const l = learners.find((x) => x.id === g.learnerId);
              return (
                <Card key={g.id} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: g.id } })} style={{ padding: 14 }}>
                  <Txt v="caption" color={colors.textMuted}>
                    {l?.fullName ?? l?.displayName}
                  </Txt>
                  <Txt v="subheading" color={colors.ink}>
                    {g.title}
                  </Txt>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: r.kind === 'humanReview' ? colors.blushSoft : colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 6 }}>
                    <Txt v="caption" color={r.kind === 'humanReview' ? '#C23A5C' : colors.primaryDeep}>
                      {KIND_LABEL[r.kind]}
                    </Txt>
                  </View>
                  <Txt v="bodySm" color={colors.textSoft}>
                    {r.reasons[0]}
                  </Txt>
                </Card>
              );
            })
          )}
        </View>
      )}
      <View style={{ height: 8, borderRadius: radius.sm, ...shadows.none }} />
    </Screen>
  );
}

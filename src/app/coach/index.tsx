import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { PersonAvatar, PEOPLE } from '@/components/characters/People';
import { Fox } from '@/components/characters/fox/Fox';
import { CoachNav, ReviewChip, StatCard, WeekBars } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Card, Screen, SegmentedTabs, Tap, Txt } from '@/components/ui';
import { KIND_LABEL } from '@/engine/decision';
import { useApp } from '@/store';
import { fitFontSize } from '@/lib/fitText';
import { useDashboard, useNow } from '@/store/derived';
import { colors, fonts, GUTTER, radius, shadows } from '@/theme';

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** 22 · Coach Dashboard */
export default function Dashboard() {
  const adultName = useApp((s) => s.adultName);
  const team = useApp((s) => s.team);
  const learners = useApp((s) => s.learners);
  const goals = useApp((s) => s.goals);
  const demo = useApp((s) => s.demoData);
  const now = useNow();
  const setActive = useApp((s) => s.setActiveLearner);
  const me = team.find((m) => m.isSelf);
  const ids = useMemo(() => (me ? me.learnerIds : learners.map((l) => l.id)), [me, learners]);
  const stats = useDashboard(ids);
  const [tab, setTab] = useState<'overview' | 'learners' | 'insights'>('overview');
  const { width } = useWindowDimensions();
  const hello = `${greeting(now)},`;
  const helloSize = fitFontSize(hello.length > adultName.length ? hello : `${adultName}!`, fonts.black, 31, 22, width - 2 * GUTTER - 112);

  const openLearner = (id: string) => {
    setActive(id);
    router.push({ pathname: '/coach/learner/[id]', params: { id } });
  };

  const goalTitle = (id: string) => goals.find((g) => g.id === id)?.title ?? 'Goal';
  const learnerName = (id: string) => {
    const l = learners.find((x) => x.id === id);
    return l?.fullName ?? l?.displayName ?? '';
  };
  const reviewCount = (id: string) => stats.review.filter((r) => r.learnerId === id).length;

  return (
    <Screen
      edges={['top']}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Txt v="display" color={colors.heading} style={{ fontSize: helloSize, lineHeight: Math.round(helloSize * 1.2) }} numberOfLines={2} adjustsFontSizeToFit accessibilityRole="header">
              {`${hello}\n${adultName}!`}
            </Txt>
            {demo ? (
              <Tap onPress={() => router.push('/coach/privacy')} accessibilityRole="link" accessibilityLabel="Showing sample data. Start fresh in Privacy and Data" style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.butterSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Txt v="label" color={colors.text} style={{ fontSize: 13.5 }}>
                  Sample data · Start fresh
                </Txt>
                <Icon name="chevronRight" size={14} color={colors.text} />
              </Tap>
            ) : null}
          </View>
          <Tap onPress={() => router.push('/coach/settings')} accessibilityLabel="Your account" style={{ borderRadius: 48, borderWidth: 4, borderColor: '#DCEBFC' }}>
            <PersonAvatar look={demo ? PEOPLE.taylor : PEOPLE.you} size={90} />
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
            <StatCard icon={<Icon name="people" size={52} />} value={String(stats.learners)} label="Learners" onPress={() => router.replace('/coach/learners')} />
            <StatCard icon={<Icon name="sprout" size={52} />} value={String(stats.goalsInProgress)} label={'Goals in\nProgress'} onPress={() => router.replace('/coach/goals')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <StatCard icon={<Icon name="heart" size={52} />} value={String(stats.needSupport.length)} valueColor="#E0264F" label="Need Support" onPress={() => setTab('insights')} />
            <StatCard icon={<Icon name="star" size={52} />} value={String(stats.celebrations)} valueColor={colors.mintDeep} label="Celebrations" />
          </View>
          <Appear delay={100}>
            <Card style={{ marginTop: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Txt v="heading" color={colors.cobalt} style={{ fontSize: 23 }}>
                  This Week
                </Txt>
                <Tap onPress={() => router.replace('/coach/learners')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingLeft: 12, marginVertical: -12 }} accessibilityLabel="View all learners">
                  <Txt v="label" color={colors.cobalt} style={{ fontSize: 17 }}>
                    View All
                  </Txt>
                  <Icon name="chevronRight" size={20} color={colors.cobalt} />
                </Tap>
              </View>
              <WeekBars days={stats.days} height={118} />
            </Card>
          </Appear>
          <Appear delay={180}>
            <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingRight: 16 }}>
              <View style={{ width: 118, height: 112, justifyContent: 'flex-end' }}>
                <Fox pose="bust" size={118} wavePaw decorative />
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
              const n = reviewCount(l.id);
              return (
                <Appear key={l.id} delay={i * 30}>
                  <Card onPress={() => openLearner(l.id)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }} accessibilityLabel={`${l.fullName ?? l.displayName}${n ? `, ${n} goal${n === 1 ? '' : 's'} to review` : ''}`}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5F0FD', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                      <BuddyPortrait id={l.buddy} size={60} motion="off" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt v="subheading" color={colors.ink} numberOfLines={1}>
                        {l.fullName ?? l.displayName}
                      </Txt>
                      <Txt v="bodySm" color={colors.textMuted} numberOfLines={1}>
                        {[l.age ? `${l.age} years old` : null, l.grade].filter(Boolean).join(' • ')}
                      </Txt>
                      {n ? <ReviewChip n={n} /> : null}
                    </View>
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
            Goals where BrightPath suggests the adults take a closer look at the plan — support, access or the goal itself. Each one explains why, and nothing changes automatically when a human review is needed.
          </Txt>
          {stats.review.length === 0 ? (
            <Card style={{ padding: 16 }}>
              <Txt v="body">No goals to review right now.</Txt>
            </Card>
          ) : (
            stats.needSupport.map((lid) => (
              <View key={lid} style={{ gap: 8 }}>
                <Txt v="label" color={colors.ink} accessibilityRole="header" style={{ marginTop: 4 }}>
                  {learnerName(lid)}
                </Txt>
                {stats.review
                  .filter((r) => r.learnerId === lid)
                  .map((r) => (
                    <Card key={r.goalId} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: r.goalId } })} style={{ padding: 14 }}>
                      <Txt v="subheading" color={colors.ink}>
                        {goalTitle(r.goalId)}
                      </Txt>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: r.kind === 'humanReview' ? colors.blushSoft : colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 6 }}>
                        <Txt v="caption" color={r.kind === 'humanReview' ? colors.alertText : colors.primaryDeep}>
                          {KIND_LABEL[r.kind]}
                        </Txt>
                      </View>
                      <Txt v="bodySm" color={colors.textSoft}>
                        {r.reason}
                      </Txt>
                    </Card>
                  ))}
              </View>
            ))
          )}
          {stats.gathering.length ? (
            <View style={{ gap: 8, marginTop: 6 }}>
              <Txt v="subheading" color={colors.ink} accessibilityRole="header">
                Needs more observations
              </Txt>
              <Txt v="bodySm" color={colors.textSoft}>
                Not enough evidence yet to suggest anything. A few more observations will help.
              </Txt>
              {stats.gathering.map((x) => (
                <Card key={x.goalId} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: x.goalId } })} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt v="caption" color={colors.textMuted}>
                      {learnerName(x.learnerId)}
                    </Txt>
                    <Txt v="label" color={colors.ink}>
                      {goalTitle(x.goalId)}
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.cobalt} />
                </Card>
              ))}
            </View>
          ) : null}
        </View>
      )}
      <View style={{ height: 8, borderRadius: radius.sm, ...shadows.none }} />
    </Screen>
  );
}

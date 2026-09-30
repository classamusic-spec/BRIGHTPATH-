import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { EvidenceRow } from '@/components/coach/EvidenceRow';
import { JourneyStepper } from '@/components/coach/JourneyStepper';
import { AREA_META, AreaIcon, HillStrip, withRouteLearner } from '@/components/coach/Kit';
import { Icon, type IconName } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Card, Header, ListRow, ProgressBar, Screen, SegmentedTabs, Sheet, StatusFace, Tap, Txt } from '@/components/ui';
import { CELL_LABEL } from '@/engine/context';
import { KIND_LABEL } from '@/engine/decision';
import { CONFIDENCE_LABEL } from '@/engine/evidence';
import type { Learner, SkillArea } from '@/engine/types';
import { useClock } from '@/lib/clock';
import { useApp } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useAreaScores, useContextMatrix, useGoalsToReview, useGoalViews, useLearnerObservations } from '@/store/derived';
import { colors, radius, tones } from '@/theme';

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const RECENT: SkillArea[] = ['communication', 'emotions', 'routines', 'independence'];
const BAR_COLORS: Record<string, string> = { communication: colors.mint, emotions: '#3F86F0', routines: '#B28CF4', independence: colors.butter };

const MENU: { label: string; icon: IconName; path: string }[] = [
  { label: 'Access Profile', icon: 'shield', path: '/coach/learner/[id]/access' },
  { label: 'Interests', icon: 'palette', path: '/coach/learner/[id]/interests' },
  { label: 'Team & Sharing', icon: 'people', path: '/coach/learner/[id]/team' },
  { label: 'Weekly Summary', icon: 'bars', path: '/coach/learner/[id]/weekly' },
  { label: 'Growth Map', icon: 'mountain', path: '/coach/learner/[id]/growth-map' },
  { label: 'Context Matrix', icon: 'blocks', path: '/coach/learner/[id]/context' },
  { label: 'Progress Report', icon: 'barsGreen', path: '/coach/learner/[id]/report' },
  { label: 'Coach Insights', icon: 'bulb', path: '/coach/learner/[id]/insights' },
  { label: 'Support Path Planner', icon: 'sprout', path: '/coach/learner/[id]/support-path' },
  { label: 'Real-World Observation', icon: 'tree', path: '/coach/learner/[id]/real-world' },
  { label: 'Rewards / Profile', icon: 'star', path: '/coach/learner/[id]/profile' },
];

/** 23 · Learner Overview */
export default withRouteLearner(LearnerOverview);

function LearnerOverview({ learner }: { learner: Learner }) {
  const [tab, setTab] = useState<'overview' | 'progress' | 'goals' | 'notes'>('overview');
  const [menu, setMenu] = useState(false);
  const [detail, setDetail] = useState<'good' | 'support' | 'engaged' | null>(null);
  const areas = useAreaScores(learner.id, 30, RECENT);
  const matrix = useContextMatrix(learner.id);
  const views = useGoalViews(learner.id);
  const obs = useLearnerObservations(learner.id);
  const sessions = useApp(useShallow((s) => s.runs.filter((r) => r.learnerId === learner.id)));
  const now = useClock();
  const go = (path: string, params: Record<string, string> = {}) => router.push({ pathname: path as never, params: { id: learner.id, ...params } } as never);

  const cells = matrix.flat();
  const good = cells.filter((c) => c.status === 'strong' || c.status === 'growing');
  const support = cells.filter((c) => c.status === 'needs' || c.status === 'some');
  const recentObs = useMemo(() => [...obs].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 25), [obs]);
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  // A mission counts once the child finished it or took at least one step in it; just opening one doesn't.
  const engagedCount = sessions.filter((r) => {
    const t = new Date(r.startedAt).getTime();
    if (t <= weekAgo) return false;
    return !!r.completedAt || obs.some((o) => o.source === 'app' && o.missionId === r.missionId && new Date(o.at).getTime() >= t);
  }).length;
  const engaged = engagedCount >= 3;
  const learnerIds = useMemo(() => [learner.id], [learner.id]);
  const review = useGoalsToReview(learnerIds);
  const goodAreas = new Set(good.map((c) => c.area)).size;

  return (
    <Screen
      padded={false}
      header={
        <Header
          title=""
          right={
            <Tap onPress={() => setMenu(true)} accessibilityLabel="More for this learner" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="dotsV" size={28} color={colors.cobalt} />
            </Tap>
          }
        />
      }
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: -8 }}>
          <View style={{ width: 118, height: 118, borderRadius: 59, backgroundColor: '#DCEBFB', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', borderWidth: 4, borderColor: '#FFFFFF' }}>
            <BuddyPortrait id={learner.buddy} size={124} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="title" color={colors.heading} style={{ fontSize: 30 }} accessibilityRole="header">
              {learner.fullName ?? learner.displayName}
            </Txt>
            <Txt v="bodyLg" color={colors.textSoft} style={{ fontSize: 19 }}>
              {[learner.age ? `${learner.age} years old` : null, learner.grade].filter(Boolean).join('  •  ')}
            </Txt>
          </View>
        </Appear>
        <SegmentedTabs
          items={[
            { key: 'overview', label: 'Overview' },
            { key: 'progress', label: 'Progress' },
            { key: 'goals', label: 'Goals' },
            { key: 'notes', label: 'Notes' },
          ]}
          value={tab}
          onChange={setTab}
          style={{ marginTop: 16, marginBottom: 14 }}
        />

        {tab === 'overview' && (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { key: 'good' as const, face: <StatusFace kind="good" size={68} />, label: 'Doing Well', caption: `${goodAreas} area${goodAreas === 1 ? '' : 's'}` },
                review.length
                  ? { key: 'support' as const, face: <StatusFace kind="support" size={68} />, label: 'Needs\nSupport', caption: `${review.length} goal${review.length === 1 ? '' : 's'} to review` }
                  : { key: 'support' as const, face: <Icon name="sprout" size={68} />, label: 'Keep noticing', caption: 'Nothing to review' },
                { key: 'engaged' as const, face: <View style={{ opacity: engaged ? 1 : 0.5 }}><Icon name="heart" size={68} /></View>, label: engaged ? 'Very Engaged' : 'Engagement', caption: `${engagedCount} this week` },
              ].map((t, i) => (
                <Appear key={t.key} delay={i * 80} style={{ flex: 1, flexBasis: 0, minWidth: 0 }}>
                  <Card onPress={() => setDetail(t.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, minHeight: 138, justifyContent: 'center' }} accessibilityLabel={`${t.label.replace('\n', ' ')}, ${t.caption}`}>
                    {t.face}
                    <Txt v="label" center color={colors.text} style={{ marginTop: 8, fontSize: 16 }}>
                      {t.label}
                    </Txt>
                    <Txt v="caption" center color={colors.textMuted} style={{ fontSize: 13 }} numberOfLines={2}>
                      {t.caption}
                    </Txt>
                  </Card>
                </Appear>
              ))}
            </View>
            <Appear delay={150}>
              <Card style={{ marginTop: 14, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Txt v="heading" color={colors.heading} style={{ fontSize: 23 }} accessibilityRole="header">
                    Recent Progress
                  </Txt>
                  <Tap onPress={() => go('/coach/learner/[id]/report')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingLeft: 12, marginVertical: -12 }} accessibilityLabel="View full progress report">
                    <Txt v="label" color={colors.cobalt} style={{ fontSize: 17 }}>
                      View All
                    </Txt>
                    <Icon name="chevronRight" size={20} color={colors.cobalt} />
                  </Tap>
                </View>
                {areas.map((a, i) => (
                  <View key={a.area} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }} accessible accessibilityLabel={`${AREA_META[a.area].label}: ${a.n ? Math.round(a.score * 100) + '%' : 'not enough evidence'}`}>
                    <AreaIcon area={a.area} size={46} variant="badge" />
                    <View style={{ flex: 1 }}>
                      <Txt v="body" color={colors.text} style={{ fontSize: 18.5, marginBottom: 6 }}>
                        {AREA_META[a.area].badge}
                      </Txt>
                      {a.n ? (
                        <ProgressBar value={a.score} color={BAR_COLORS[a.area]} height={14} delay={i * 80} />
                      ) : (
                        <Txt v="caption" color={colors.textMuted} style={{ fontSize: 13 }}>
                          Not enough evidence yet
                        </Txt>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            </Appear>
            <View style={{ marginTop: 14, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#EAF4FD' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 4 }}>
                <Icon name="sprout" size={56} />
                <Txt v="bodyLg" center color={colors.text} style={{ flex: 1, fontSize: 18 }}>
                  {learner.summaryLine ?? `${learner.displayName} is growing one small step at a time.`}
                </Txt>
                <Icon name="tree" size={40} />
              </View>
              <HillStrip />
            </View>
          </>
        )}

        {tab === 'progress' && (
          <View style={{ gap: 10 }}>
            <Txt v="body" color={colors.textSoft}>
              Where each goal is on the Discover → Practice → Explore → Remember journey.
            </Txt>
            {views.filter((v) => v.goal.status === 'active').map((v) => (
              <Card key={v.goal.id} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: v.goal.id } })} style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt v="subheading" color={colors.ink} style={{ flex: 1 }}>
                    {v.goal.title}
                  </Txt>
                  <Txt v="label" color={colors.primaryDeep}>{`${Math.round(v.progress * 100)}%`}</Txt>
                </View>
                <JourneyStepper mode={v.rec.mode} />
                <ProgressBar value={v.progress} color={colors.mint} />
                <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>{`Next: ${KIND_LABEL[v.rec.kind]} · Evidence ${CONFIDENCE_LABEL[v.rec.confidence].toLowerCase()}`}</Txt>
              </Card>
            ))}
            <Card style={{ overflow: 'hidden' }}>
              <ListRow icon="mountain" iconTone="blue" title="Growth Map" subtitle="See the path so far" onPress={() => go('/coach/learner/[id]/growth-map')} />
              <ListRow icon="blocks" iconTone="butter" title="Context Matrix" subtitle="Home, school, social, outdoors" onPress={() => go('/coach/learner/[id]/context')} />
              <ListRow icon="barsGreen" iconTone="mint" title="Progress Report" subtitle="By skill area and range" onPress={() => go('/coach/learner/[id]/report')} />
            </Card>
          </View>
        )}

        {tab === 'goals' && (
          <View style={{ gap: 10 }}>
            {views.map((v) => (
              <Card key={v.goal.id} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: v.goal.id } })} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AreaIcon area={v.goal.skillArea} size={46} />
                <View style={{ flex: 1 }}>
                  <Txt v="subheading" color={colors.ink}>
                    {v.goal.title}
                  </Txt>
                  <Txt v="caption" color={colors.textMuted}>{`${v.goal.status === 'active' ? 'In progress' : v.goal.status} · ${Math.round(v.progress * 100)}%`}</Txt>
                </View>
                <Icon name="chevronRight" size={20} color={colors.cobalt} />
              </Card>
            ))}
            <Card onPress={() => router.push({ pathname: '/coach/goal/new', params: { learner: learner.id } })} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#BFD2F2' }} flat>
              <Icon name="plus" size={22} color={colors.primary} />
              <Txt v="label" color={colors.primary}>
                Create a Growth Goal
              </Txt>
            </Card>
          </View>
        )}

        {tab === 'notes' && (
          <View style={{ gap: 10 }}>
            <Card onPress={() => go('/coach/learner/[id]/observe')} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', backgroundColor: colors.primary }} flat>
              <Icon name="plus" size={22} color="#FFFFFF" />
              <Txt v="label" color="#FFFFFF">
                Add an Observation
              </Txt>
            </Card>
            {recentObs.map((o) => (
              <EvidenceRow key={o.id} obs={o} />
            ))}
          </View>
        )}
      </View>

      <Sheet visible={menu} onClose={() => setMenu(false)} title={learner.displayName} subtitle="Tools for this learner">
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.lg, overflow: 'hidden' }}>
          {MENU.map((m) => (
            <ListRow
              key={m.label}
              icon={m.icon}
              iconTone="white"
              tileSize={44}
              title={m.label}
              onPress={() => {
                setMenu(false);
                go(m.path);
              }}
            />
          ))}
        </View>
      </Sheet>

      <Sheet visible={!!detail} onClose={() => setDetail(null)} title={detail === 'good' ? 'Doing well' : detail === 'support' ? (review.length ? 'Goals to review' : 'Keep noticing') : 'Engagement'} subtitle={detail === 'support' ? 'Suggestions are about the plan and supports — never the child.' : 'From the last 60 days of observations. Tap Context Matrix for the raw evidence.'}>
        {detail === 'engaged' ? (
          <Txt v="bodyLg">{`${engagedCount} mission${engagedCount === 1 ? '' : 's'} started and worked on in the last 7 days. Engagement is about participation — never a score.`}</Txt>
        ) : (
          <View style={{ gap: 8 }}>
            {detail === 'support' && review.length
              ? review.map((r) => {
                  const g = views.find((v) => v.goal.id === r.goalId)?.goal;
                  return (
                    <Tap key={r.goalId} onPress={() => { setDetail(null); router.push({ pathname: '/coach/goal/[id]', params: { id: r.goalId } }); }} accessibilityLabel={`${g?.title ?? 'Goal'}: ${KIND_LABEL[r.kind]}`} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }}>
                      <Txt v="label" color={colors.ink}>
                        {g?.title ?? 'Goal'}
                      </Txt>
                      <Txt v="caption" color={r.kind === 'humanReview' ? colors.alertText : colors.primaryDeep}>
                        {KIND_LABEL[r.kind]}
                      </Txt>
                      <Txt v="bodySm" color={colors.textSoft}>
                        {r.reason}
                      </Txt>
                    </Tap>
                  );
                })
              : null}
            {(detail === 'good' ? good : support).length === 0 ? (
              detail === 'support' && review.length ? null : <Txt v="body">Not enough evidence yet.</Txt>
            ) : (
              (detail === 'good' ? good : support).map((c) => (
                <View key={`${c.area}${c.setting}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }}>
                  <AreaIcon area={c.area} size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt v="body">{`${AREA_META[c.area].label} · ${cap(c.setting)}`}</Txt>
                    <Txt v="caption" color={colors.textMuted}>
                      {CELL_LABEL[c.status]}
                    </Txt>
                  </View>
                  <Txt v="caption" color={colors.textMuted}>{`${c.valid} observation${c.valid === 1 ? '' : 's'}`}</Txt>
                </View>
              ))
            )}
            <Tap onPress={() => { setDetail(null); go('/coach/learner/[id]/context'); }} style={{ padding: 12, alignSelf: 'center' }} accessibilityLabel="Open Context Matrix">
              <Txt v="label" color={colors.primary}>
                Open Context Matrix
              </Txt>
            </Tap>
          </View>
        )}
      </Sheet>
      <View style={{ height: 16, backgroundColor: tones.white.bg, opacity: 0 }} />
    </Screen>
  );
}

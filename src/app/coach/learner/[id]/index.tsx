import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AreaIcon, AREA_META, HillStrip } from '@/components/coach/Kit';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon, type IconName } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Card, Header, ListRow, ProgressBar, Screen, SegmentedTabs, Sheet, StatusFace, Tap, Txt } from '@/components/ui';
import { KIND_LABEL, MODE_COPY } from '@/engine/decision';
import { CONFIDENCE_LABEL, OUTCOME_LABELS } from '@/engine/evidence';
import type { SkillArea } from '@/engine/types';
import { useClock } from '@/lib/clock';
import { useApp } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useAreaScores, useContextMatrix, useGoalViews, useLearnerObservations } from '@/store/derived';
import { colors, radius, tones } from '@/theme';

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
export default function LearnerOverview() {
  const learner = useRouteLearner();
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
  const engagedCount = obs.filter((o) => new Date(o.at).getTime() > weekAgo && o.source === 'app').length + sessions.filter((r) => new Date(r.startedAt).getTime() > weekAgo).length;

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
            <Txt v="title" color="#1320C4" style={{ fontSize: 30 }}>
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
                { key: 'good' as const, face: <StatusFace kind="good" size={68} />, label: 'Doing Well' },
                { key: 'support' as const, face: <StatusFace kind="support" size={68} />, label: 'Needs\nSupport' },
                { key: 'engaged' as const, face: <Icon name="heart" size={68} />, label: 'Very Engaged' },
              ].map((t, i) => (
                <Appear key={t.key} delay={i * 80} style={{ flex: 1 }}>
                  <Card onPress={() => setDetail(t.key)} style={{ alignItems: 'center', paddingVertical: 14, minHeight: 138, justifyContent: 'center' }} accessibilityLabel={t.label.replace('\n', ' ')}>
                    {t.face}
                    <Txt v="label" center color={colors.text} style={{ marginTop: 8, fontSize: 16 }}>
                      {t.label}
                    </Txt>
                  </Card>
                </Appear>
              ))}
            </View>
            <Appear delay={150}>
              <Card style={{ marginTop: 14, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Txt v="heading" color="#1320C4" style={{ fontSize: 23 }}>
                    Recent Progress
                  </Txt>
                  <Tap onPress={() => go('/coach/learner/[id]/report')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel="View full progress report">
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
                      <ProgressBar value={a.score} color={BAR_COLORS[a.area]} height={14} delay={i * 80} />
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
                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                  {(['discover', 'practice', 'explore', 'remember'] as const).map((m) => (
                    <View key={m} style={{ flex: 1, paddingVertical: 4, borderRadius: 999, backgroundColor: m === v.rec.mode ? colors.primary : '#EEF2F9', alignItems: 'center' }}>
                      <Txt v="caption" color={m === v.rec.mode ? '#FFFFFF' : colors.textMuted}>
                        {MODE_COPY[m].label}
                      </Txt>
                    </View>
                  ))}
                </View>
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
              <Card key={o.id} style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt v="label" color={colors.ink}>
                    {o.title ?? (o.source === 'app' ? `In-app · ${o.context.activity ?? 'mission'}` : o.context.setting)}
                  </Txt>
                  <Txt v="caption" color={colors.textMuted}>
                    {new Date(o.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Txt>
                </View>
                {o.note ? (
                  <Txt v="bodySm" color={colors.textSoft} style={{ marginTop: 2 }}>
                    {o.note}
                  </Txt>
                ) : null}
                <Txt v="caption" color={o.quality === 'valid' ? colors.mintDeep : colors.textMuted} style={{ marginTop: 4 }}>
                  {o.quality === 'valid' ? OUTCOME_LABELS[o.outcome] : o.quality === 'accessLimited' ? 'Access limited — not counted as a miss' : 'Excluded'}
                </Txt>
              </Card>
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

      <Sheet visible={!!detail} onClose={() => setDetail(null)} title={detail === 'good' ? 'Doing well' : detail === 'support' ? 'Could use support' : 'Engagement'} subtitle="From the last 60 days of observations. Tap Context Matrix for the raw evidence.">
        {detail === 'engaged' ? (
          <Txt v="bodyLg">{`${engagedCount} in-app moments or missions in the last 7 days. Engagement is about participation — never a score.`}</Txt>
        ) : (
          <View style={{ gap: 8 }}>
            {(detail === 'good' ? good : support).length === 0 ? (
              <Txt v="body">Not enough evidence yet.</Txt>
            ) : (
              (detail === 'good' ? good : support).map((c) => (
                <View key={`${c.area}${c.setting}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }}>
                  <AreaIcon area={c.area} size={34} />
                  <Txt v="body" style={{ flex: 1 }}>{`${AREA_META[c.area].label} · ${c.setting}`}</Txt>
                  <Txt v="caption" color={colors.textMuted}>{`${c.valid} obs`}</Txt>
                </View>
              ))
            )}
            <Tap onPress={() => { setDetail(null); go('/coach/learner/[id]/context'); }} style={{ padding: 10, alignSelf: 'center' }} accessibilityLabel="Open Context Matrix">
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

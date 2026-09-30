import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AREA_META, AreaIcon, GrowBar, ShareAction, withRouteLearner } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { Appear, Card, Header, PillTabs, ProgressBar, Screen, SegmentedTabs, Txt } from '@/components/ui';
import { KIND_LABEL } from '@/engine/decision';
import { RANGE_DAYS, type RangeKey } from '@/engine/summary';
import type { Learner, SkillArea } from '@/engine/types';
import { useGoalViews, useInsights, useProgressReport } from '@/store/derived';
import { colors, radius } from '@/theme';

const BAR_COLOR: Partial<Record<SkillArea, string>> = {
  communication: '#6FCB93',
  emotions: '#FBD978',
  focus: '#8AD3F7',
  social: '#A99BF7',
  independence: '#F7A1B6',
};

/** 36 · Progress Report */
export default withRouteLearner(ProgressReport);

function ProgressReport({ learner }: { learner: Learner }) {
  const [tab, setTab] = useState<'overview' | 'skills' | 'goals' | 'insights'>('overview');
  const [range, setRange] = useState<RangeKey>('1M');
  const report = useProgressReport(learner.id, range);
  const views = useGoalViews(learner.id);
  const insights = useInsights(learner.id, learner.displayName);
  const H = 190;
  const growing = report.skillsGrowing > 0;
  const shareText = [
    `${learner.displayName} — Progress Report (last ${RANGE_DAYS[range]} days)`,
    ...report.bars.map((b) => `${AREA_META[b.area].label}: ${b.n ? `${Math.round(b.score * 100)}% across ${b.n} observation${b.n === 1 ? '' : 's'}` : 'not enough evidence yet'}`),
    `Goals with growth: ${report.skillsGrowing} of ${report.goalsInProgress} in progress.`,
    ...report.milestones.map((m) => `Milestone: ${m.label}`),
  ].join('\n');

  return (
    <Screen header={<Header title="Progress Report" right={<ShareAction title="Progress Report" message={shareText} />} />}>
      <SegmentedTabs
        items={[
          { key: 'overview', label: 'Overview' },
          { key: 'skills', label: 'Skills' },
          { key: 'goals', label: 'Goals' },
          { key: 'insights', label: 'Insights' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <PillTabs items={(['1W', '1M', '3M', '1Y'] as RangeKey[]).map((k) => ({ key: k, label: k }))} value={range} onChange={setRange} style={{ marginTop: 12 }} size="lg" />

      {(tab === 'overview' || tab === 'skills') && (
        <Appear key={range}>
          <View style={{ marginTop: 18 }}>
            <View style={{ height: H + 22, justifyContent: 'flex-end' }}>
              {[0.25, 0.5, 0.75, 1].map((g) => (
                <View key={g} style={{ position: 'absolute', left: 0, right: 0, bottom: g * H, height: 1, backgroundColor: '#E1E8F4' }} />
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                {report.bars.map((b, i) => (
                  <View key={b.area} style={{ alignItems: 'center', width: 70 }} accessible accessibilityLabel={`${AREA_META[b.area].label}: ${b.n ? `${Math.round(b.score * 100)}%, ${b.n} observation${b.n === 1 ? '' : 's'}${b.n < 4 ? ', limited evidence' : ''}` : 'not enough evidence'}`}>
                    <Txt v="caption" color={colors.textMuted} style={{ fontSize: 13, marginBottom: 4 }}>
                      {b.n ? `${Math.round(b.score * 100)}%` : '—'}
                    </Txt>
                    {b.n ? (
                      <View style={{ opacity: b.n < 4 ? 0.4 : 1 }}>
                        <GrowBar value={b.score} color={BAR_COLOR[b.area] ?? colors.primary} height={H} width={58} delay={i * 80} radiusPx={12} />
                      </View>
                    ) : (
                      <View style={{ width: 58, height: 40, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C6D3EA' }} />
                    )}
                  </View>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
              {report.bars.map((b) => (
                <View key={b.area} style={{ alignItems: 'center', width: 70 }}>
                  <AreaIcon area={b.area} size={34} />
                  <Txt v="body" color={colors.text} style={{ fontSize: 15, marginTop: 2 }}>
                    {AREA_META[b.area].short}
                  </Txt>
                  {b.n > 0 && b.n < 4 ? (
                    <Txt v="caption" center color={colors.textMuted} style={{ fontSize: 12 }}>
                      limited evidence
                    </Txt>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </Appear>
      )}

      {tab === 'overview' && (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {[
              { icon: <Icon name="arrowUp" size={50} />, value: report.skillsGrowing, label: 'Skills Growing', color: colors.mintDeep },
              { icon: <Icon name="target" size={50} />, value: report.goalsInProgress, label: 'Goals in Progress', color: colors.cobalt },
              { icon: <Icon name="star" size={50} />, value: report.milestones.length, label: 'New Milestones', color: '#E0264F' },
            ].map((s, i) => (
              <Appear key={s.label} delay={i * 70} style={{ flex: 1, flexBasis: 0, minWidth: 0 }}>
                <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 }}>
                  {s.icon}
                  <Txt v="number" color={s.color} style={{ fontSize: 30, marginTop: 4 }}>
                    {String(s.value)}
                  </Txt>
                  <Txt v="body" center color={colors.textSoft} style={{ fontSize: 15 }}>
                    {s.label}
                  </Txt>
                </Card>
              </Appear>
            ))}
          </View>
          <Card tone="tint" style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }}>
            <Icon name="barsGreen" size={62} />
            <View style={{ flex: 1 }}>
              <Txt v="subheading" color={colors.heading}>
                {growing ? 'Steady progress!' : 'Early days — keep noticing.'}
              </Txt>
              <Txt v="body" color={colors.text}>{growing ? `${report.skillsGrowing} of ${learner.displayName}’s goals show growth in this range.` : `Each observation helps show what’s working for ${learner.displayName}.`}</Txt>
            </View>
          </Card>
          <Txt v="caption" color={colors.textMuted} style={{ marginTop: 10 }}>
            “Skills growing” counts goals whose journey moved forward in this range, once they have at least 6 valid observations. Bars show how accessible each area was (outcome and support), not a grade; faded bars rest on fewer than 4 observations.
          </Txt>
        </>
      )}

      {tab === 'skills' && (
        <Card style={{ padding: 16, marginTop: 14 }}>
          {report.bars.map((b) => (
            <View key={b.area} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt v="label">{AREA_META[b.area].label}</Txt>
                <Txt v="caption" color={colors.textMuted}>
                  {b.n ? `${b.n} valid observations` : 'Not enough evidence'}
                </Txt>
              </View>
              <ProgressBar value={b.score} color={BAR_COLOR[b.area] ?? colors.primary} height={10} style={{ marginTop: 6 }} />
            </View>
          ))}
        </Card>
      )}

      {tab === 'goals' && (
        <View style={{ gap: 10, marginTop: 14 }}>
          {views.map((v) => (
            <Card key={v.goal.id} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: v.goal.id } })} style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt v="subheading" style={{ flex: 1 }}>
                  {v.goal.title}
                </Txt>
                <Txt v="label" color={colors.mintDeep}>{`${Math.round(v.progress * 100)}%`}</Txt>
              </View>
              <ProgressBar value={v.progress} height={10} style={{ marginVertical: 8 }} />
              <Txt v="caption" color={colors.textMuted}>{`Next: ${KIND_LABEL[v.rec.kind]}`}</Txt>
            </Card>
          ))}
          {report.milestones.length ? (
            <Card tone="butter" style={{ padding: 14 }}>
              <Txt v="subheading">Milestones this range</Txt>
              {report.milestones.map((m) => (
                <Txt key={m.label + m.at} v="body">{`⭐ ${m.label}`}</Txt>
              ))}
            </Card>
          ) : null}
        </View>
      )}

      {tab === 'insights' && (
        <View style={{ gap: 10, marginTop: 14 }}>
          {insights.patterns.map((p) => (
            <Card key={p.title} style={{ padding: 14, borderRadius: radius.lg }}>
              <Txt v="subheading" color={colors.ink}>
                {p.title}
              </Txt>
              <Txt v="body" color={colors.textSoft}>
                {p.detail}
              </Txt>
            </Card>
          ))}
        </View>
      )}
      <Txt v="caption" color={colors.textFaint} style={{ marginTop: 12 }}>{`Range: last ${RANGE_DAYS[range]} days`}</Txt>
    </Screen>
  );
}

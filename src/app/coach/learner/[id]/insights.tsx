import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { withRouteLearner } from '@/components/coach/Kit';
import { Fox } from '@/components/characters/fox/Fox';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Landscape } from '@/components/scenery/Landscape';
import { EvidenceRow } from '@/components/coach/EvidenceRow';
import { Appear, Button, Card, Chip, Header, Screen, SegmentedTabs, Sheet, Tap, Txt } from '@/components/ui';
import type { Learner } from '@/engine/types';
import { KIND_LABEL } from '@/engine/decision';
import { CONFIDENCE_LABEL } from '@/engine/evidence';
import type { KeyInsight } from '@/engine/summary';
import { useApp } from '@/store';
import { useGoalViews, useInsights } from '@/store/derived';
import { colors, radius, shadows } from '@/theme';

const ICONS: Record<KeyInsight['id'], IconName> = { communication: 'barsGreen', emotions: 'heart', independence: 'group' };
// The chip says which way the count moved; its colour says whether that is good news for this area.
const TONE: Record<KeyInsight['trend'], 'mint' | 'sky' | 'butter' | 'lavender'> = { up: 'mint', steady: 'sky', down: 'butter', unknown: 'lavender' };
const moved = (k: KeyInsight) => (k.count > k.prevCount ? 'More' : k.count < k.prevCount ? 'Fewer' : 'Steady');

/** 40 · Coach Insights — observational, evidence-linked, non-diagnostic (§52). */
export default withRouteLearner(CoachInsights);

function CoachInsights({ learner }: { learner: Learner }) {
  const [tab, setTab] = useState<'overview' | 'patterns' | 'recs'>('overview');
  const { key, patterns } = useInsights(learner.id, learner.displayName);
  const views = useGoalViews(learner.id);
  const observations = useApp((s) => s.observations);
  const [open, setOpen] = useState<KeyInsight | null>(null);
  const evidence = useMemo(() => (open ? observations.filter((o) => open.evidenceIds.includes(o.id)).slice(-8).reverse() : []), [open, observations]);
  const validCount = useMemo(() => observations.filter((o) => o.learnerId === learner.id && o.quality === 'valid' && o.outcome !== 'accessLimited').length, [observations, learner.id]);
  const enough = validCount >= 6;
  // Only celebrate when the evidence says so: two areas up and none unknown.
  const great = key.filter((k) => k.trend === 'up').length >= 2 && !key.some((k) => k.trend === 'unknown');
  const go = (path: string, params: Record<string, string> = {}) => router.push({ pathname: path as never, params } as never);

  return (
    <Screen padded={false} header={<Header title="Coach Insights" />}>
      <View style={{ paddingHorizontal: 18 }}>
        <SegmentedTabs
          items={[
            { key: 'overview', label: 'Overview' },
            { key: 'patterns', label: 'Patterns' },
            { key: 'recs', label: 'Recommendations' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'overview' && (
        <>
          <View style={styles.hero}>
            <Landscape
              style={StyleSheet.absoluteFill}
              spec={{
                skyTop: '#E4F1FD',
                horizon: 0.55,
                ground: 0.78,
                trees: [
                  { x: 0.07, base: 0.8, h: 80 },
                  { x: 0.5, base: 0.86, h: 76, tone: 'light' },
                  { x: 0.9, base: 0.9, h: 60 },
                ],
                bushes: [{ x: 0.74, base: 0.92, s: 1.1, tone: 'deep' }],
              }}
            />
            <View style={{ position: 'absolute', left: 8, bottom: -10 }}>
              <Fox pose="wave" size={220} decorative />
            </View>
            <Appear from="zoom" style={styles.bubble}>
              <Txt v="heading" color={colors.heading} style={{ fontSize: 22 }}>
                {great ? 'Great progress!' : 'Here’s what we’re noticing'}
              </Txt>
              <Txt v="body" color={colors.text} style={{ fontSize: 17, lineHeight: 23 }}>{enough ? `Here are insights to support ${learner.displayName}’s next steps.` : `After a few more observations, patterns for ${learner.displayName} will start to show.`}</Txt>
            </Appear>
          </View>
          <View style={{ paddingHorizontal: 16, marginTop: -16 }}>
            {enough ? (
              <Card style={{ padding: 16, borderRadius: radius.xl }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Txt v="heading" color={colors.heading} style={{ fontSize: 23 }} accessibilityRole="header">
                    Key Insights
                  </Txt>
                  <Txt v="body" color={colors.textSoft}>
                    This Month
                  </Txt>
                </View>
                {key.map((k, i) => (
                  <Tap key={k.id} onPress={() => setOpen(k)} accessibilityLabel={`${k.title}. ${k.subtitle}. ${k.trend === 'unknown' ? 'Not enough evidence' : moved(k)}. ${k.count} this month, ${k.prevCount} last month.`} style={[styles.row, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.lineSoft } : null]} scale={0.98}>
                    <View style={{ width: 70, alignItems: 'center', opacity: k.trend === 'unknown' ? 0.5 : 1 }}>
                      <Icon name={ICONS[k.id]} size={k.id === 'independence' ? 60 : 56} color={k.id === 'independence' ? '#2F74E8' : undefined} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt v="subheading" color={colors.heading} style={{ fontSize: 19.5, lineHeight: 25 }}>
                        {k.title}
                      </Txt>
                      <Txt v="body" color={colors.textMuted} style={{ fontSize: 16.5 }}>
                        {k.subtitle}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {k.trend !== 'unknown' ? <Chip size="sm" tone={TONE[k.trend]} label={moved(k)} /> : null}
                        <Txt v="caption" color={colors.textMuted} style={{ fontSize: 13 }}>{`${k.count} this month · ${k.prevCount} last month`}</Txt>
                      </View>
                    </View>
                    <Icon name="chevronRight" size={24} color={colors.cobalt} />
                  </Tap>
                ))}
              </Card>
            ) : (
              <Card style={{ padding: 18, borderRadius: radius.xl, gap: 10 }}>
                <Txt v="heading" color={colors.heading} style={{ fontSize: 21 }} accessibilityRole="header">
                  Not enough evidence yet
                </Txt>
                <Txt v="body" color={colors.textSoft}>{`Insights appear once there are at least 6 observations (${validCount} so far). Each one helps show what’s working for ${learner.displayName}.`}</Txt>
                <Button title="Add an observation" size="md" onPress={() => go('/coach/learner/[id]/observe', { id: learner.id })} />
                <Button title="Create a Growth Goal" kind="soft" size="md" onPress={() => go('/coach/goal/new', { learner: learner.id })} />
              </Card>
            )}
            <View style={styles.keep}>
              <Icon name="bulb" size={64} />
              <View style={{ flex: 1 }}>
                <Txt v="subheading" color={colors.heading}>
                  Keep going!
                </Txt>
                <Txt v="body" color={colors.text}>
                  You’re making a real difference.
                </Txt>
              </View>
            </View>
          </View>
        </>
      )}

      {tab === 'patterns' && (
        <View style={{ padding: 16, gap: 10 }}>
          {patterns.map((p) => (
            <Card key={p.title} style={{ padding: 16 }}>
              <Txt v="subheading" color={colors.ink}>
                {p.title}
              </Txt>
              <Txt v="body" color={colors.textSoft} style={{ marginTop: 2 }}>
                {p.detail}
              </Txt>
            </Card>
          ))}
          <Card tone="sky" style={{ padding: 14 }}>
            <Txt v="bodySm">Patterns describe what was observed. They never explain why a child behaves a certain way.</Txt>
          </Card>
        </View>
      )}

      {tab === 'recs' && (
        <View style={{ padding: 16, gap: 10 }}>
          {views
            .filter((v) => v.goal.status === 'active')
            .map((v) => (
              <Card key={v.goal.id} onPress={() => router.push({ pathname: '/coach/goal/[id]', params: { id: v.goal.id } })} style={{ padding: 16 }}>
                <Txt v="caption" color={colors.textMuted}>
                  {v.goal.title.toUpperCase()}
                </Txt>
                <Txt v="heading" color={v.rec.kind === 'humanReview' ? colors.alertText : colors.heading} style={{ fontSize: 20 }}>
                  {KIND_LABEL[v.rec.kind]}
                </Txt>
                <Txt v="body" color={colors.text} style={{ marginTop: 4 }}>
                  {v.rec.reasons[0]}
                </Txt>
                <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>{`Evidence: ${CONFIDENCE_LABEL[v.rec.confidence]} · ${v.summary.validCount} valid opportunities`}</Txt>
              </Card>
            ))}
        </View>
      )}

      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open?.title} subtitle={open?.detail}>
        <Txt v="label" color={colors.ink} style={{ marginBottom: 8 }}>
          Evidence behind this insight
        </Txt>
        {evidence.length === 0 ? (
          <Txt v="body" color={colors.textMuted}>
            Not enough evidence yet.
          </Txt>
        ) : (
          evidence.map((o) => <EvidenceRow key={o.id} obs={o} style={{ marginBottom: 8 }} />)
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 260, marginTop: 12, overflow: 'hidden' },
  bubble: { position: 'absolute', right: 14, top: 18, width: '52%', backgroundColor: '#FFFFFF', borderRadius: radius.xl, padding: 16, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 8 },
  keep: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FDF1D2', borderRadius: radius.lg, padding: 16, marginTop: 14 },
});

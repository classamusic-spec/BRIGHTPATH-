import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { AREA_META, AreaIcon, CardHeader, HillStrip, ShareAction, withRouteLearner } from '@/components/coach/Kit';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Appear, Card, Header, ProgressBar, Screen, Tap, Txt } from '@/components/ui';
import type { Learner } from '@/engine/types';
import { weekBounds } from '@/engine/summary';
import { useWeekly } from '@/store/derived';
import { fitFontSize } from '@/lib/fitText';
import { colors, fonts, radius } from '@/theme';

const DAY = 24 * 3600 * 1000;
const BAR: Record<string, string> = { communication: colors.mint, emotions: '#3F86F0', routines: '#B28CF4', independence: colors.butter };

function fmt(d: Date) {
  const withYear = d.getFullYear() !== new Date().getFullYear();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

const BANNER: Record<'up' | 'down' | 'steady' | 'unknown', string> = {
  up: 'Moving forward',
  steady: 'Holding steady',
  down: 'A week to look at supports',
  unknown: 'Keep noticing',
};

/**
 * 29 · Weekly Summary — defaults to the last complete week; plain-language
 * summary, what changed, sources, what helped, next step and why (§37).
 */
export default withRouteLearner(WeeklySummary);

function WeeklySummary({ learner }: { learner: Learner }) {
  const [offset, setOffset] = useState(-1);
  const anchor = useMemo(() => new Date(weekBounds(new Date()).start.getTime() + offset * 7 * DAY + DAY), [offset]);
  const w = useWeekly(learner.id, learner.displayName, anchor);
  const end = new Date(w.end.getTime() - DAY);
  const isCurrent = offset === 0;
  const { width } = useWindowDimensions();
  const stacked = width < 380;
  const shareText = [
    `${learner.displayName} — Weekly Summary, ${fmt(w.start)} to ${fmt(end)}`,
    w.narrative.summary,
    `What changed: ${w.narrative.changed}`,
    `Where evidence came from: ${w.narrative.sources}`,
    `What helped: ${w.narrative.helped}`,
    `Suggested next step: ${w.narrative.next}`,
  ].join('\n');

  return (
    <Screen header={<Header title="Weekly Summary" right={<ShareAction title="Weekly Summary" message={shareText} />} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Tap onPress={() => setOffset((o) => o - 1)} accessibilityLabel="Previous week" style={{ width: 54, height: 48, borderRadius: 16, backgroundColor: '#E3ECFA', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronLeft" size={26} color={colors.cobalt} />
        </Tap>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt v="heading" color={colors.cobalt} style={{ fontSize: 20, fontFamily: 'Nunito_700Bold' }}>{`${fmt(w.start)} — ${fmt(end)}`}</Txt>
          {isCurrent ? (
            <Txt v="caption" color={colors.textMuted}>
              This week so far
            </Txt>
          ) : null}
        </View>
        <Tap onPress={() => setOffset((o) => Math.min(0, o + 1))} disabled={isCurrent} accessibilityLabel="Next week" style={{ width: 54, height: 48, borderRadius: 16, backgroundColor: '#E3ECFA', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronRight" size={26} color={colors.cobalt} />
        </Tap>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        {[
          { icon: <Icon name="bars" size={56} />, label: 'Observations', value: w.observations },
          { icon: <Icon name="sprout" size={56} />, label: 'Goals', value: w.goals },
          { icon: <Icon name="star" size={56} />, label: 'Celebrations', value: w.celebrations },
        ].map((s, i) => (
          <Appear key={s.label} delay={i * 70} style={{ flex: 1 }}>
            <Card style={{ alignItems: 'center', paddingVertical: 14 }}>
              {s.icon}
              <Txt v="body" color={colors.text} style={{ marginTop: 6, fontSize: 16 }}>
                {s.label}
              </Txt>
              <Txt v="number" color={colors.cobalt} style={{ fontSize: 28 }}>
                {String(s.value)}
              </Txt>
            </Card>
          </Appear>
        ))}
      </View>

      <Appear delay={150}>
        <Card style={{ marginTop: 12, padding: 16 }}>
          <CardHeader title="Focus Areas" style={{ marginBottom: 4 }} />
          {w.focus.map((f, i) => (
            <View key={f.area} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }} accessible accessibilityLabel={`${AREA_META[f.area].label}: ${f.n ? `${Math.round(f.score * 100)}%, ${f.n} observation${f.n === 1 ? '' : 's'}` : 'not enough evidence yet'}`}>
              <AreaIcon area={f.area} size={44} variant="badge" />
              <View style={{ flex: 1, minWidth: 0, flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: stacked ? 4 : 12 }}>
                <Txt v="body" color={colors.text} style={{ fontSize: stacked ? 18 : fitFontSize(AREA_META[f.area].badge, fonts.semibold, 18, 13, 108), ...(stacked ? null : { width: 110 }) }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {AREA_META[f.area].badge}
                </Txt>
                <View style={{ flex: stacked ? undefined : 1 }}>
                  {f.n ? (
                    <>
                      <ProgressBar value={f.score} color={BAR[f.area]} height={16} delay={i * 80} />
                      <Txt v="caption" color={colors.textMuted} style={{ fontSize: 13, marginTop: 2 }}>{`${Math.round(f.score * 100)}% · ${f.n} observation${f.n === 1 ? '' : 's'}`}</Txt>
                    </>
                  ) : (
                    <Txt v="bodySm" color={colors.textMuted}>
                      Not enough evidence yet
                    </Txt>
                  )}
                </View>
              </View>
            </View>
          ))}
        </Card>
      </Appear>

      <Appear delay={220} style={{ marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#E2F5E6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingBottom: 4 }}>
          <Icon name="sprout" size={72} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt v="subheading" color={colors.heading} style={{ fontSize: 20 }}>
              {BANNER[w.changedTrend]}
            </Txt>
            <Txt v="body" color={colors.text} style={{ fontSize: 16 }}>
              {w.narrative.changed}
            </Txt>
          </View>
        </View>
        <HillStrip height={28} />
      </Appear>

      {/* Plain-language narrative (Framework §37) */}
      <Card style={{ marginTop: 14, padding: 16, gap: 12 }}>
        <Txt v="subheading" color={colors.ink}>
          In plain words
        </Txt>
        {(
          [
            ['star', 'Summary', w.narrative.summary],
            ['arrowUp', 'What changed', w.narrative.changed],
            ['globe', 'Where evidence came from', w.narrative.sources],
            ['sprout', 'What helped', w.narrative.helped],
            ['target', 'Suggested next step', w.narrative.next],
          ] as [IconName, string, string][]
        ).map(([icon, k, v]) => (
          <View key={k} style={{ flexDirection: 'row', gap: 12 }}>
            <Icon name={icon} size={28} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt v="label" color={colors.heading} style={{ fontSize: 15 }} accessibilityRole="header">
                {k}
              </Txt>
              <Txt v="body" color={colors.text}>
                {v}
              </Txt>
            </View>
          </View>
        ))}
        {w.narrative.why.length ? (
          <View>
            <Txt v="label" color={colors.heading} style={{ fontSize: 15 }}>
              Why
            </Txt>
            {w.narrative.why.map((r) => (
              <Txt key={r} v="body" color={colors.text}>{`• ${r}`}</Txt>
            ))}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

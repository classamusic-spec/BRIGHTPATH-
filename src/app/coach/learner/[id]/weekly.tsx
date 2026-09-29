import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AreaIcon, AREA_META, HillStrip } from '@/components/coach/Kit';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon } from '@/components/icons/Icon';
import { Appear, Card, Header, ProgressBar, Screen, Tap, Txt } from '@/components/ui';
import { weekBounds } from '@/engine/summary';
import { useWeekly } from '@/store/derived';
import { colors, radius } from '@/theme';

const DAY = 24 * 3600 * 1000;
const BAR: Record<string, string> = { communication: colors.mint, emotions: '#3F86F0', routines: '#B28CF4', independence: colors.butter };

function fmt(d: Date, withYear = false) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

/**
 * 29 · Weekly Summary — defaults to the last complete week; plain-language
 * summary, what changed, sources, what helped, next step and why (§37).
 */
export default function WeeklySummary() {
  const learner = useRouteLearner();
  const [offset, setOffset] = useState(-1);
  const anchor = useMemo(() => new Date(weekBounds(new Date()).start.getTime() + offset * 7 * DAY + DAY), [offset]);
  const w = useWeekly(learner.id, learner.displayName, anchor);
  const end = new Date(w.end.getTime() - DAY);
  const isCurrent = offset === 0;

  return (
    <Screen header={<Header title="Weekly Summary" />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Tap onPress={() => setOffset((o) => o - 1)} accessibilityLabel="Previous week" style={{ width: 54, height: 48, borderRadius: 16, backgroundColor: '#E3ECFA', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronLeft" size={26} color={colors.cobalt} />
        </Tap>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt v="heading" color={colors.cobalt} style={{ fontSize: 20, fontFamily: 'Nunito_700Bold' }}>{`${fmt(w.start)} — ${fmt(end, true)}`}</Txt>
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
          <Txt v="heading" color="#1320C4" style={{ fontSize: 23, marginBottom: 4 }}>
            Focus Areas
          </Txt>
          {w.focus.map((f, i) => (
            <View key={f.area} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }} accessible accessibilityLabel={`${AREA_META[f.area].label}: ${f.n ? Math.round(f.score * 100) + '%' : 'not enough evidence'}`}>
              <AreaIcon area={f.area} size={44} />
              <Txt v="body" color={colors.text} style={{ width: 128, fontSize: 17 }}>
                {AREA_META[f.area].label}
              </Txt>
              <View style={{ flex: 1 }}>
                <ProgressBar value={f.n ? f.score : 0} color={BAR[f.area]} height={16} delay={i * 80} />
              </View>
            </View>
          ))}
        </Card>
      </Appear>

      <Appear delay={220} style={{ marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#E2F5E6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingBottom: 4 }}>
          <Icon name="sprout" size={72} />
          <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 20 }}>
            {'Steady progress.\nBrighter tomorrows.'}
          </Txt>
        </View>
        <HillStrip height={28} />
      </Appear>

      {/* Plain-language narrative (Framework §37) */}
      <Card style={{ marginTop: 14, padding: 16, gap: 12 }}>
        <Txt v="subheading" color={colors.ink}>
          In plain words
        </Txt>
        {[
          ['Summary', w.narrative.summary],
          ['What changed', w.narrative.changed],
          ['Where evidence came from', w.narrative.sources],
          ['What helped', w.narrative.helped],
          ['Suggested next step', w.narrative.next],
        ].map(([k, v]) => (
          <View key={k}>
            <Txt v="caption" color={colors.textMuted}>
              {k.toUpperCase()}
            </Txt>
            <Txt v="body" color={colors.text}>
              {v}
            </Txt>
          </View>
        ))}
        {w.narrative.why.length ? (
          <View>
            <Txt v="caption" color={colors.textMuted}>
              WHY
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

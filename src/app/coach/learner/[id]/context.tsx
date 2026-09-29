import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AreaIcon, AREA_META } from '@/components/coach/Kit';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Appear, Card, Header, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { CELL_LABEL, type CellStatus, type MatrixCell } from '@/engine/context';
import { OUTCOME_LABELS, SUPPORT_LABELS } from '@/engine/evidence';
import type { Setting } from '@/engine/types';
import { useApp } from '@/store';
import { useContextMatrix } from '@/store/derived';
import { colors, radius, shadows } from '@/theme';

const COLS: { key: Setting; label: string; icon: IconName; color?: string }[] = [
  { key: 'home', label: 'Home', icon: 'house', color: '#2F6FE0' },
  { key: 'school', label: 'School', icon: 'backpack', color: '#2F6FE0' },
  { key: 'social', label: 'Social', icon: 'group', color: '#2F6FE0' },
  { key: 'outdoors', label: 'Outdoors', icon: 'sun' },
];

const CELL_COLOR: Record<CellStatus, string> = {
  strong: '#6ACB8C',
  growing: '#B9E8C6',
  some: '#FCD679',
  needs: '#F78D9E',
  none: '#C9B5F7',
};

/** 32 · Context Matrix — every label opens the raw observations behind it. */
export default function ContextMatrix() {
  const learner = useRouteLearner();
  const matrix = useContextMatrix(learner.id);
  const observations = useApp((s) => s.observations);
  const [cell, setCell] = useState<MatrixCell | null>(null);
  const cellObs = cell ? observations.filter((o) => cell.observationIds.includes(o.id)) : [];

  return (
    <Screen header={<Header title="Context Matrix" subtitle={`See how ${learner.displayName} does in different settings.`} />}>
      <View style={styles.headRow}>
        <View style={{ width: 118 }} />
        {COLS.map((c) => (
          <View key={c.key} style={styles.colHead}>
            <Icon name={c.icon} size={32} color={c.color} />
            <Txt v="caption" color={colors.text} style={{ marginTop: 2, fontFamily: 'Nunito_700Bold' }}>
              {c.label}
            </Txt>
          </View>
        ))}
      </View>
      {matrix.map((row, ri) => (
        <Appear key={row[0].area} delay={ri * 50} style={styles.row}>
          <View style={styles.rowHead}>
            <AreaIcon area={row[0].area} size={40} />
            <Txt v="label" color={colors.text} style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>
              {AREA_META[row[0].area].label}
            </Txt>
          </View>
          {row.map((c) => (
            <Tap
              key={c.setting}
              onPress={() => setCell(c)}
              accessibilityLabel={`${AREA_META[c.area].label} at ${c.setting}: ${CELL_LABEL[c.status]}, ${c.valid} observations`}
              style={[styles.cell, { backgroundColor: CELL_COLOR[c.status] }]}
              scale={0.92}
            >
              {c.status === 'none' ? <Txt v="caption" color="#5B3FA8">?</Txt> : null}
            </Tap>
          ))}
        </Appear>
      ))}
      <View style={styles.legend}>
        {(
          [
            ['strong', 'Doing well'],
            ['some', 'Some support'],
            ['needs', 'Needs support'],
          ] as [CellStatus, string][]
        ).map(([k, l]) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: CELL_COLOR[k] }]} />
            <Txt v="bodySm" color={colors.text} style={{ fontSize: 15 }}>
              {l}
            </Txt>
          </View>
        ))}
      </View>
      <View style={[styles.legendItem, { alignSelf: 'center', marginTop: 4 }]}>
        <View style={[styles.swatch, { backgroundColor: CELL_COLOR.growing, width: 22, height: 22 }]} />
        <Txt v="caption" color={colors.textMuted}>
          Growing
        </Txt>
        <View style={[styles.swatch, { backgroundColor: CELL_COLOR.none, width: 22, height: 22, marginLeft: 12 }]} />
        <Txt v="caption" color={colors.textMuted}>
          Not enough evidence yet
        </Txt>
      </View>
      <Card style={{ marginTop: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: colors.butterSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bulb" size={62} />
        </View>
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 18, lineHeight: 24 }}>
          {`Different environments bring different opportunities. You’re giving ${learner.displayName} what they need.`}
        </Txt>
      </Card>

      <Sheet visible={!!cell} onClose={() => setCell(null)} title={cell ? `${AREA_META[cell.area].label} · ${cell.setting}` : ''} subtitle={cell ? `${CELL_LABEL[cell.status]} — ${cell.valid} valid observation${cell.valid === 1 ? '' : 's'} in the last 60 days` : ''}>
        {cellObs.length === 0 ? (
          <Txt v="body">No observations here yet. Try a Real-World Quest in this setting.</Txt>
        ) : (
          <View style={{ gap: 8 }}>
            {cellObs.map((o) => (
              <View key={o.id} style={{ backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt v="label">{o.title ?? o.context.setting}</Txt>
                  <Txt v="caption" color={colors.textMuted}>
                    {new Date(o.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Txt>
                </View>
                {o.note ? (
                  <Txt v="bodySm" color={colors.textSoft}>
                    {o.note}
                  </Txt>
                ) : null}
                <Txt v="caption" color={colors.mintDeep}>{`${OUTCOME_LABELS[o.outcome]} · ${SUPPORT_LABELS[o.supportLevel]}`}</Txt>
              </View>
            ))}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8, marginBottom: 8 },
  colHead: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: radius.md, alignItems: 'center', paddingVertical: 8, ...shadows.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  rowHead: { width: 118, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cell: { flex: 1, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 34, height: 34, borderRadius: 9 },
});

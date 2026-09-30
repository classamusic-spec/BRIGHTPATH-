import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { EvidenceRow } from '@/components/coach/EvidenceRow';
import { AREA_META, AreaIcon, withRouteLearner } from '@/components/coach/Kit';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Appear, Card, Header, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { CELL_LABEL, type CellStatus, type MatrixCell } from '@/engine/context';
import type { Learner, Setting } from '@/engine/types';
import { useApp } from '@/store';
import { useContextMatrix } from '@/store/derived';
import { fitFontSize } from '@/lib/fitText';
import { colors, fonts, radius, shadows } from '@/theme';

const SETTING_LABEL: Record<Setting, string> = { home: 'Home', school: 'School', social: 'Social', outdoors: 'Outdoors' };

const COLS: { key: Setting; label: string; icon: IconName; color?: string }[] = [
  { key: 'home', label: 'Home', icon: 'house', color: '#2F6FE0' },
  { key: 'school', label: 'School', icon: 'backpack', color: '#2F6FE0' },
  { key: 'social', label: 'Social', icon: 'group', color: '#2F6FE0' },
  { key: 'outdoors', label: 'Outside', icon: 'sun' },
];

const CELL_COLOR: Record<CellStatus, string> = {
  strong: '#6ACB8C',
  growing: '#B9E8C6',
  some: '#FCD679',
  needs: '#F78D9E',
  none: '#C9B5F7',
};

/** A second, shape-based channel so the matrix reads without colour. */
const CELL_BORDER: Record<CellStatus, string> = {
  strong: '#2F9E5E',
  growing: '#6ACB8C',
  some: '#C99A1E',
  needs: '#D8456A',
  none: '#8E63EE',
};

const LEGEND: CellStatus[] = ['strong', 'growing', 'some', 'needs', 'none'];

function CellGlyph({ status, size = 18 }: { status: CellStatus; size?: number }) {
  const ink = CELL_BORDER[status];
  if (status === 'strong') return <Icon name="check" size={size + 2} color={colors.mintText} />;
  if (status === 'growing') return <Icon name="arrowUp" size={size} />;
  if (status === 'some') return <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size, backgroundColor: '#8A6510' }} />;
  if (status === 'needs') return <Icon name="heart" size={size} />;
  return (
    <Txt v="label" color={ink} style={{ fontSize: size - 2, lineHeight: size + 2 }}>
      ?
    </Txt>
  );
}

/** 32 · Context Matrix — every label opens the raw observations behind it. */
export default withRouteLearner(ContextMatrix);

function ContextMatrix({ learner }: { learner: Learner }) {
  const matrix = useContextMatrix(learner.id);
  const observations = useApp((s) => s.observations);
  const [cell, setCell] = useState<MatrixCell | null>(null);
  const cellObs = cell ? observations.filter((o) => cell.observationIds.includes(o.id)).sort((a, b) => (a.at < b.at ? 1 : -1)) : [];
  const { width } = useWindowDimensions();
  const narrow = width < 380;
  const HEAD_W = narrow ? 120 : 134;
  const ICON = narrow ? 28 : 32;
  // Two-word labels wrap; a single long word ("Communication") shrinks to fit instead of clipping.
  const rowLabelSize = (label: string) => Math.min(...label.split(' ').map((w) => fitFontSize(w, fonts.bold, 15, 11, HEAD_W - ICON - 8)));

  return (
    <Screen header={<Header title="Context Matrix" subtitle={`See how ${learner.displayName} does in different settings.`} />}>
      <View style={styles.headRow}>
        <View style={{ width: HEAD_W }} />
        {COLS.map((c) => (
          <View key={c.key} style={styles.colHead}>
            <Icon name={c.icon} size={30} color={c.color} />
            <Txt v="caption" color={colors.text} style={{ marginTop: 2, fontFamily: 'Nunito_700Bold', fontSize: 13 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {c.label}
            </Txt>
          </View>
        ))}
      </View>
      {matrix.map((row, ri) => (
        <Appear key={row[0].area} delay={ri * 50} style={styles.row}>
          <View style={[styles.rowHead, { width: HEAD_W }]}>
            <AreaIcon area={row[0].area} size={ICON} />
            <Txt v="label" color={colors.text} style={{ flex: 1, fontSize: rowLabelSize(AREA_META[row[0].area].label), lineHeight: 18 }} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
              {AREA_META[row[0].area].label}
            </Txt>
          </View>
          {row.map((c) => (
            <Tap
              key={c.setting}
              onPress={() => setCell(c)}
              accessibilityLabel={`${AREA_META[c.area].label} at ${SETTING_LABEL[c.setting]}: ${CELL_LABEL[c.status]}, ${c.valid} observation${c.valid === 1 ? '' : 's'}`}
              style={[styles.cell, { backgroundColor: CELL_COLOR[c.status], borderColor: CELL_BORDER[c.status] }]}
              scale={0.92}
            >
              <CellGlyph status={c.status} />
            </Tap>
          ))}
        </Appear>
      ))}
      <View style={styles.legend} accessibilityRole="summary">
        {LEGEND.map((k) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: CELL_COLOR[k], borderColor: CELL_BORDER[k] }]}>
              <CellGlyph status={k} size={14} />
            </View>
            <Txt v="bodySm" color={colors.text} style={{ fontSize: 14 }}>
              {CELL_LABEL[k]}
            </Txt>
          </View>
        ))}
      </View>
      <Card style={{ marginTop: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.butterSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bulb" size={58} />
        </View>
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 18, lineHeight: 24 }}>
          {`Different environments bring different opportunities. You’re giving ${learner.displayName} what they need.`}
        </Txt>
      </Card>

      <Sheet visible={!!cell} onClose={() => setCell(null)} title={cell ? `${AREA_META[cell.area].label} · ${SETTING_LABEL[cell.setting]}` : ''} subtitle={cell ? `${CELL_LABEL[cell.status]} — ${cell.valid} valid observation${cell.valid === 1 ? '' : 's'} in the last 60 days${cell.status === 'none' ? ' (4 are needed to show a pattern)' : ''}` : ''}>
        {cellObs.length === 0 ? (
          <Txt v="body">No observations here yet. Try a Real-World Quest in this setting.</Txt>
        ) : (
          <View style={{ gap: 8 }}>
            {cellObs.map((o) => (
              <EvidenceRow key={o.id} obs={o} />
            ))}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 8, marginBottom: 8, marginHorizontal: -4 },
  colHead: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: radius.md, alignItems: 'center', paddingVertical: 8, ...shadows.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, marginHorizontal: -4 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cell: { flex: 1, height: 54, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});

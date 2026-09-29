import { StyleSheet, View } from 'react-native';

import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Appear, Card, CheckBadge, Header, Screen, Tap, Txt } from '@/components/ui';
import { INTERESTS } from '@/content/interests';
import type { InterestId } from '@/engine/types';
import { selectHaptic } from '@/lib/feedback';
import { useApp } from '@/store';
import { colors, radius, tones } from '@/theme';

const ICON: Record<InterestId, IconName> = {
  animals: 'paw',
  art: 'palette',
  sports: 'soccer',
  music: 'music',
  nature: 'tree',
  books: 'book',
  building: 'blocks',
  helping: 'heart',
  trains: 'backpack',
  water: 'moon',
  movement: 'runner',
};

const FEATURED_TONE: Partial<Record<InterestId, 'mint' | 'butter' | 'white'>> = { animals: 'mint', art: 'butter' };

/** 25 · Interests — used as mission wrappers (Framework §9). */
export default function Interests() {
  const learner = useRouteLearner();
  const updateLearner = useApp((s) => s.updateLearner);
  const toggle = (id: InterestId) => {
    selectHaptic();
    const has = learner.interests.includes(id);
    updateLearner(learner.id, { interests: has ? learner.interests.filter((x) => x !== id) : [...learner.interests, id] });
  };
  const featured = INTERESTS.filter((i) => i.featured);
  const more = INTERESTS.filter((i) => !i.featured);
  return (
    <Screen header={<Header title={`${learner.displayName}’s Interests`} />}>
      <View style={styles.grid}>
        {featured.map((it, i) => {
          const on = learner.interests.includes(it.id);
          const tone = FEATURED_TONE[it.id] ?? 'white';
          return (
            <Appear key={it.id} delay={i * 60} style={{ width: '48%' }}>
              <Tap
                onPress={() => toggle(it.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={it.label}
                style={[styles.tile, { backgroundColor: on ? tones[tone === 'white' ? 'blue' : tone].bg : '#FFFFFF', borderColor: on ? tones[tone === 'white' ? 'blue' : tone].border : 'transparent' }]}
              >
                <Icon name={ICON[it.id]} size={104} />
                <Txt v="heading" color={colors.text} style={{ marginTop: 10, fontSize: 22, fontFamily: 'Nunito_700Bold' }}>
                  {it.label}
                </Txt>
                <View style={styles.check}>{on ? <CheckBadge size={36} /> : <View style={styles.empty} />}</View>
              </Tap>
            </Appear>
          );
        })}
      </View>
      <Card style={{ marginTop: 14, padding: 16 }}>
        <Txt v="heading" color="#1320C4" style={{ fontSize: 24, marginBottom: 6 }}>
          More Interests
        </Txt>
        {more.map((it, i) => {
          const on = learner.interests.includes(it.id);
          return (
            <View key={it.id} style={[styles.row, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.lineSoft } : null]}>
              <View style={{ width: 64, alignItems: 'center' }}>
                <Icon name={ICON[it.id]} size={52} />
              </View>
              <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 19 }}>
                {it.label}
              </Txt>
              <Tap onPress={() => toggle(it.id)} style={[styles.plus, on ? { backgroundColor: colors.primary } : null]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${on ? 'Remove' : 'Add'} ${it.label}`}>
                <Icon name={on ? 'check' : 'plus'} size={26} color={on ? '#FFFFFF' : colors.cobalt} />
              </Tap>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: 4 },
  tile: { borderRadius: radius.lg, alignItems: 'center', paddingVertical: 22, borderWidth: 2 },
  check: { position: 'absolute', top: 10, right: 10 },
  empty: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#C9D3E6', backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  plus: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E6EEFB', alignItems: 'center', justifyContent: 'center' },
});

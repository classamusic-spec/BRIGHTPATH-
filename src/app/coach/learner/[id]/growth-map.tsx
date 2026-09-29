import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { AREA_META, LearnerNav } from '@/components/coach/Kit';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon } from '@/components/icons/Icon';
import { GrowthMapScene, GrowthNode, SIGNPOSTS } from '@/components/scenery/GrowthMapScene';
import { Card, Header, PillTabs, ProgressBar, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { RANGE_DAYS, type RangeKey } from '@/engine/summary';
import type { SkillArea } from '@/engine/types';
import { useAreaScores } from '@/store/derived';
import { colors, radius, shadows } from '@/theme';

const LABEL: Record<keyof typeof SIGNPOSTS, string> = {
  communication: 'Communication',
  emotions: 'Emotional\nSkills',
  independence: 'Independence',
  routines: 'Daily Routines',
};

const SIGN_ICON: Record<keyof typeof SIGNPOSTS, ReactNode> = {
  communication: <Icon name="faceTeal" size={42} color="#3DBE77" />,
  emotions: <Icon name="heartCircle" size={42} />,
  independence: <Icon name="star" size={42} />,
  routines: <Icon name="calendarCircle" size={42} />,
};

const AREAS: SkillArea[] = ['communication', 'emotions', 'independence', 'routines'];

/** 31 · Growth Map — Finn walks as far as the evidence shows, never further. */
export default function GrowthMap() {
  const learner = useRouteLearner();
  const [range, setRange] = useState<RangeKey>('1M');
  const scores = useAreaScores(learner.id, RANGE_DAYS[range], AREAS);
  const [open, setOpen] = useState<SkillArea | null>(null);
  const withEvidence = scores.filter((s) => s.n > 0);
  const progress = useMemo(() => (withEvidence.length ? withEvidence.reduce((a, s) => a + s.score, 0) / withEvidence.length : 0), [withEvidence]);
  const selected = scores.find((s) => s.area === open);

  return (
    <Screen padded={false} scroll={false} edges={['top']} header={<Header title="Growth Map" />} footer={<LearnerNav id={learner.id} active="progress" />}>
      <View style={{ paddingHorizontal: 16 }}>
        <PillTabs
          items={(['1W', '1M', '3M', '1Y'] as RangeKey[]).map((k) => ({ key: k, label: k }))}
          value={range}
          onChange={setRange}
          size="lg"
        />
      </View>
      <GrowthMapScene progress={progress} style={{ flex: 1, marginTop: 10 }}>
        {(Object.keys(SIGNPOSTS) as (keyof typeof SIGNPOSTS)[]).map((k) => {
          const p = SIGNPOSTS[k];
          const area = k as SkillArea;
          return (
            <GrowthNode key={k} x={p.x} y={p.y} anchor="center">
              <View style={{ position: 'absolute', left: -200, width: 400, top: -34, height: 68, alignItems: 'center', justifyContent: 'center' }}>
                <Tap onPress={() => setOpen(area)} accessibilityLabel={`${AREA_META[area].label} progress`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingLeft: 8, paddingRight: 16, height: 58, ...shadows.raised }}>
                  {SIGN_ICON[k]}
                  <Txt v="subheading" color={colors.cobalt} style={{ fontSize: 17.5, lineHeight: 21 }}>
                    {LABEL[k]}
                  </Txt>
                </Tap>
              </View>
            </GrowthNode>
          );
        })}
      </GrowthMapScene>
      <View style={{ paddingHorizontal: 12, marginTop: -40, marginBottom: 8 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: radius.xl }}>
          <Icon name="barsGreen" size={66} />
          <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 20, lineHeight: 26 }}>
            Small steps add up to big progress!
          </Txt>
        </Card>
      </View>

      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open ? AREA_META[open].label : ''} subtitle={`Last ${RANGE_DAYS[range]} days`}>
        {selected ? (
          <View>
            {selected.n ? (
              <>
                <ProgressBar value={selected.score} color={colors.mint} height={16} />
                <Txt v="body" color={colors.text} style={{ marginTop: 10 }}>{`${selected.n} valid observations. Score reflects how accessible the skill was (support needed and outcome), not the child.`}</Txt>
              </>
            ) : (
              <Txt v="body">Not enough evidence in this range yet.</Txt>
            )}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

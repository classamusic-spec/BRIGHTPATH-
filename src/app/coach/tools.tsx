import { router } from 'expo-router';
import { View } from 'react-native';

import { CoachNav } from '@/components/coach/Kit';
import type { IconName } from '@/components/icons/Icon';
import { Appear, Card, Header, ListRow, Screen, Txt } from '@/components/ui';
import { selectLearner, useApp } from '@/store';
import { colors } from '@/theme';
import type { Tone } from '@/theme';

const TOOLS: { icon: IconName; tone: Tone; title: string; sub: string; path: string }[] = [
  { icon: 'doc', tone: 'blue', title: 'Add an Observation', sub: 'What did you notice?', path: '/coach/learner/[id]/observe' },
  { icon: 'tree', tone: 'mint', title: 'Real-World Observation', sub: 'Moments and Real-World Quests', path: '/coach/learner/[id]/real-world' },
  { icon: 'sprout', tone: 'mint', title: 'Support Path Planner', sub: 'From current pattern to preferred path', path: '/coach/learner/[id]/support-path' },
  { icon: 'blocks', tone: 'butter', title: 'Context Matrix', sub: 'How skills show up across settings', path: '/coach/learner/[id]/context' },
  { icon: 'bars', tone: 'sky', title: 'Weekly Summary', sub: 'Plain-language week in review', path: '/coach/learner/[id]/weekly' },
  { icon: 'mountain', tone: 'blue', title: 'Growth Map', sub: 'The path so far', path: '/coach/learner/[id]/growth-map' },
  { icon: 'barsGreen', tone: 'mint', title: 'Progress Report', sub: 'Skills, goals and milestones', path: '/coach/learner/[id]/report' },
  { icon: 'bulb', tone: 'butter', title: 'Coach Insights', sub: 'Observational, evidence-linked', path: '/coach/learner/[id]/insights' },
  { icon: 'shield', tone: 'lavender', title: 'Access Profile', sub: 'Sensory, communication, motor', path: '/coach/learner/[id]/access' },
];

/** Tools (coach tab) — one place for every learner tool. */
export default function Tools() {
  const learner = useApp(selectLearner);
  return (
    <Screen header={<Header title="Tools" back={false} />} footer={<CoachNav active="tools" />}>
      <Txt v="body" color={colors.textSoft} style={{ marginBottom: 10 }}>{`For ${learner.fullName ?? learner.displayName}`}</Txt>
      <View style={{ gap: 10 }}>
        {TOOLS.map((t, i) => (
          <Appear key={t.title} delay={i * 35}>
            <Card>
              <ListRow icon={t.icon} iconTone={t.tone} title={t.title} subtitle={t.sub} onPress={() => router.push({ pathname: t.path as never, params: { id: learner.id } } as never)} />
            </Card>
          </Appear>
        ))}
      </View>
    </Screen>
  );
}

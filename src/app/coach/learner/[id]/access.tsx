import { router } from 'expo-router';
import { View } from 'react-native';

import { HillStrip } from '@/components/coach/Kit';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Card, Header, IconTile, ListRow, Screen, Txt } from '@/components/ui';
import { useApp } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { colors, radius } from '@/theme';

/** 24 · Access Profile — who can see and support this learner, and how. */
export default function AccessProfileScreen() {
  const learner = useRouteLearner();
  const team = useApp(useShallow((s) => s.team.filter((m) => m.learnerIds.includes(learner.id))));
  const caregivers = team.filter((m) => m.role === 'parent' || m.role === 'caregiver').length;
  const teachers = team.filter((m) => m.role === 'teacher').length;
  const therapists = team.filter((m) => m.role === 'therapist').length;
  const go = (path: string) => router.push({ pathname: path as never, params: { id: learner.id } } as never);
  const rows = [
    { key: 'child', title: 'Child Profile', sub: learner.fullName ?? learner.displayName, node: <IconTile tone="sky" size={74} radiusPx={20} style={{ overflow: 'hidden' }}><BuddyPortrait id={learner.buddy} size={82} /></IconTile>, onPress: () => go('/coach/learner/[id]/child') },
    { key: 'care', title: 'Caregivers', sub: `${caregivers} linked`, node: <IconTile tone="mint" size={74} radiusPx={20}><Icon name="personGreen" size={50} /></IconTile>, onPress: () => go('/coach/learner/[id]/team') },
    { key: 'edu', title: 'Educators', sub: `${teachers} teacher${teachers === 1 ? '' : 's'}, ${therapists} therapist${therapists === 1 ? '' : 's'}`, node: <IconTile tone="butter" size={74} radiusPx={20}><Icon name="personYellow" size={50} /></IconTile>, onPress: () => go('/coach/learner/[id]/team') },
    { key: 'perm', title: 'Permissions', sub: 'Manage access', node: <IconTile tone="blue" size={74} radiusPx={20}><Icon name="lock" size={48} /></IconTile>, onPress: () => go('/coach/learner/[id]/team') },
    { key: 'notif', title: 'Notifications', sub: 'Email, push, summaries', node: <IconTile tone="lavender" size={74} radiusPx={20}><Icon name="bell" size={48} /></IconTile>, onPress: () => router.push('/coach/notifications') },
    { key: 'priv', title: 'Privacy & Data', sub: 'Your information is safe', node: <IconTile tone="blue" size={74} radiusPx={20}><Icon name="shield" size={46} /></IconTile>, onPress: () => router.push('/coach/privacy') },
  ];
  return (
    <Screen header={<Header title="Access Profile" />}>
      <View style={{ gap: 12 }}>
        {rows.map((r, i) => (
          <Appear key={r.key} delay={i * 50}>
            <Card onPress={r.onPress} accessibilityLabel={`${r.title}, ${r.sub}`}>
              <ListRow iconNode={r.node} title={r.title} subtitle={r.sub} right={<Icon name="chevronRight" size={24} color={colors.cobalt} />} style={{ paddingVertical: 10 }} />
            </Card>
          </Appear>
        ))}
      </View>
      <Appear delay={350} style={{ marginTop: 14, backgroundColor: '#E2F5E6', borderRadius: radius.lg, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingBottom: 6 }}>
          <Icon name="lockGreen" size={70} />
          <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 19 }}>
            A safer, kinder community for every child.
          </Txt>
        </View>
        <HillStrip height={30} />
      </Appear>
    </Screen>
  );
}

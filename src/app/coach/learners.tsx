import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CoachNav } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Button, Card, Header, Screen, Sheet, Txt } from '@/components/ui';
import { useApp } from '@/store';
import { useDashboard } from '@/store/derived';
import { colors } from '@/theme';
import { TextField } from '@/components/coach/Form';

/** Learners (coach tab). */
export default function Learners() {
  const learners = useApp((s) => s.learners);
  const team = useApp((s) => s.team);
  const setActive = useApp((s) => s.setActiveLearner);
  const addLearner = useApp((s) => s.addLearner);
  const me = team.find((m) => m.isSelf);
  const ids = me ? me.learnerIds : learners.map((l) => l.id);
  const stats = useDashboard(ids);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  return (
    <Screen header={<Header title="Learners" back={false} />} footer={<CoachNav active="learners" />}>
      <Button kind="soft" size="md" title="Add a learner" icon={<Icon name="plus" size={20} color={colors.text} />} onPress={() => setAdding(true)} style={{ marginBottom: 12 }} />
      <View style={{ gap: 10 }}>
        {learners
          .filter((l) => ids.includes(l.id))
          .map((l, i) => (
            <Appear key={l.id} delay={i * 30}>
              <Card
                onPress={() => {
                  setActive(l.id);
                  router.push({ pathname: '/coach/learner/[id]', params: { id: l.id } });
                }}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}
                accessibilityLabel={l.fullName ?? l.displayName}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5F0FD', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  <BuddyPortrait id={l.buddy} size={60} motion="off" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="subheading" color={colors.ink}>
                    {l.fullName ?? l.displayName}
                  </Txt>
                  <Txt v="bodySm" color={colors.textMuted}>
                    {[l.age ? `${l.age} years old` : null, l.grade].filter(Boolean).join(' • ') || 'Profile not finished'}
                  </Txt>
                </View>
                {stats.needSupport.includes(l.id) ? (
                  <View style={{ backgroundColor: colors.blushSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Txt v="caption" color="#C23A5C">
                      Extra support
                    </Txt>
                  </View>
                ) : null}
                <Icon name="chevronRight" size={20} color={colors.cobalt} />
              </Card>
            </Appear>
          ))}
      </View>
      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add a learner" subtitle="Use a display name — no legal names or birthdays needed.">
        <TextField label="Display name" value={name} onChangeText={setName} placeholder="e.g. Sam" />
        <TextField label="Age (optional)" value={age} onChangeText={setAge} placeholder="e.g. 7" keyboardType="number-pad" />
        <Button
          title="Add learner"
          disabled={!name.trim()}
          onPress={() => {
            const id = addLearner({ displayName: name.trim(), age: age ? Number(age) : undefined });
            setAdding(false);
            setName('');
            setAge('');
            setActive(id);
            router.push({ pathname: '/coach/learner/[id]', params: { id } });
          }}
          style={{ marginTop: 8 }}
        />
      </Sheet>
    </Screen>
  );
}

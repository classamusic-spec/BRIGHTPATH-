import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CoachNav, ReviewChip } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Button, Card, Header, Screen, Sheet, Txt } from '@/components/ui';
import { useApp } from '@/store';
import { useGoalsToReview } from '@/store/derived';
import { colors } from '@/theme';
import { TextField } from '@/components/coach/Form';

/** Learners (coach tab). */
export default function Learners() {
  const learners = useApp((s) => s.learners);
  const team = useApp((s) => s.team);
  const setActive = useApp((s) => s.setActiveLearner);
  const addLearner = useApp((s) => s.addLearner);
  const me = team.find((m) => m.isSelf);
  const ids = useMemo(() => (me ? me.learnerIds : learners.map((l) => l.id)), [me, learners]);
  const review = useGoalsToReview(ids);
  const reviews = (id: string) => review.filter((r) => r.learnerId === id).length;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const parsedAge = parseInt(age, 10);
  const ageValue = parsedAge >= 2 && parsedAge <= 18 ? parsedAge : undefined;
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
                accessibilityLabel={`${l.fullName ?? l.displayName}${reviews(l.id) ? `, ${reviews(l.id)} goals to review` : ''}`}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5F0FD', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  <BuddyPortrait id={l.buddy} size={60} motion="off" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="subheading" color={colors.ink} numberOfLines={1}>
                    {l.fullName ?? l.displayName}
                  </Txt>
                  <Txt v="bodySm" color={colors.textMuted} numberOfLines={1}>
                    {[l.age ? `${l.age} years old` : null, l.grade].filter(Boolean).join(' • ') || 'Profile not finished'}
                  </Txt>
                  {reviews(l.id) ? <ReviewChip n={reviews(l.id)} /> : null}
                </View>
                <Icon name="chevronRight" size={20} color={colors.cobalt} />
              </Card>
            </Appear>
          ))}
      </View>
      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add a learner" subtitle="Use a display name — no legal names or birthdays needed.">
        <TextField label="Display name" value={name} onChangeText={setName} placeholder="e.g. Sam" />
        <TextField label="Age (optional)" value={age} onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))} placeholder="e.g. 7" keyboardType="number-pad" maxLength={2} />
        {age && ageValue === undefined ? (
          <Txt v="bodySm" color={colors.dangerText} style={{ marginTop: -6, marginBottom: 8 }}>
            Ages 2 to 18 only — or leave it blank.
          </Txt>
        ) : null}
        <Button
          title="Add learner"
          disabled={!name.trim() || (!!age && ageValue === undefined)}
          onPress={() => {
            const id = addLearner({ displayName: name.trim(), age: ageValue });
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

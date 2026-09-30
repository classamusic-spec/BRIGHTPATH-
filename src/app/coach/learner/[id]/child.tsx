import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { withRouteLearner } from '@/components/coach/Kit';
import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { BUDDIES } from '@/components/kid/Buddy';
import { TalkPicture } from '@/components/talk/TalkPicture';
import { Button, Card, Header, ListRow, Screen, Toggle, Txt } from '@/components/ui';
import { BANDS } from '@/engine/bands';
import type { AccessProfile, BuddyId, Learner, Modality, PresentationBand } from '@/engine/types';
import { useApp } from '@/store';
import { colors, GUTTER } from '@/theme';

const STRENGTHS = ['Kind', 'Creative', 'Curious', 'Funny', 'Resilient', 'Patient', 'Helpful', 'Brave', 'Great memory', 'Loves building', 'Loves animals', 'Musical'];
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * `soon`: the child experience doesn't read this setting yet, so the switch is
 * shown but disabled rather than promising a change that won't happen.
 */
function Row({ label, sub, value, onChange, soon }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; soon?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }} accessible={soon} accessibilityLabel={soon ? `${label}, coming soon` : undefined} accessibilityState={soon ? { disabled: true } : undefined}>
      <View style={{ flex: 1, opacity: soon ? 0.6 : 1 }}>
        <Txt v="label" color={colors.ink}>
          {label}
        </Txt>
        {soon || sub ? (
          <Txt v="caption" color={colors.textMuted}>
            {soon ? 'Coming soon' : sub}
          </Txt>
        ) : null}
      </View>
      {soon ? (
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={{ opacity: 0.4 }}>
          <Toggle value={false} onChange={() => {}} label={label} />
        </View>
      ) : (
        <Toggle value={value} onChange={onChange} label={label} />
      )}
    </View>
  );
}

/**
 * Child Profile & Access Profile editor (Framework §9). Changes the actual
 * experience: sensory load, wait time, communication, presentation band.
 */
export default withRouteLearner(ChildProfile);

function ChildProfile({ learner }: { learner: Learner }) {
  const updateLearner = useApp((s) => s.updateLearner);
  const updateAccess = useApp((s) => s.updateAccess);
  const [name, setName] = useState(learner.displayName);
  const [age, setAge] = useState(learner.age ? String(learner.age) : '');
  const parsedAge = parseInt(age, 10);
  const ageValue = parsedAge >= 2 && parsedAge <= 18 ? parsedAge : undefined;
  const ageInvalid = !!age && ageValue === undefined;
  const { section } = useLocalSearchParams<{ section?: string }>();
  const scroll = useRef<ScrollView>(null);
  const [anchors, setAnchors] = useState<Record<string, number>>({});
  const scrolled = useRef(false);
  const insets = useSafeAreaInsets();
  // Deep links (Settings → Accessibility, Profile → Strengths) land on their section, once.
  useEffect(() => {
    const target = section === 'access' ? 'sensory' : section === 'strengths' ? 'strengths' : null;
    const y = target ? anchors[target] : undefined;
    if (scrolled.current || y == null) return;
    scrolled.current = true;
    scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: false });
  }, [anchors, section]);
  const anchor = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
    const y = e.nativeEvent.layout.y;
    setAnchors((a) => (a[key] === y ? a : { ...a, [key]: y }));
  };
  const strengthOptions = [...STRENGTHS, ...learner.strengths.map(cap).filter((t) => !STRENGTHS.includes(t))];
  const strengths = learner.strengths.map(cap);
  const [grade, setGrade] = useState(learner.grade ?? '');
  const a = learner.access;
  const setSensory = (patch: Partial<AccessProfile['sensory']>) => updateAccess(learner.id, { sensory: { ...a.sensory, ...patch } });
  const setMotor = (patch: Partial<AccessProfile['motor']>) => updateAccess(learner.id, { motor: { ...a.motor, ...patch } });
  const setTransitions = (patch: Partial<AccessProfile['transitions']>) => updateAccess(learner.id, { transitions: { ...a.transitions, ...patch } });

  return (
    <Screen header={<Header title="Child Profile" />} scroll={false} padded={false}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: 16 }}>
          <TextField label="Display name" value={name} onChangeText={setName} />
          <TextField label="Age (optional)" value={age} onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} />
          {ageInvalid ? (
            <Txt v="bodySm" color={colors.dangerText} style={{ marginTop: -6, marginBottom: 8 }}>
              Ages 2 to 18 only — or leave it blank.
            </Txt>
          ) : null}
          <TextField label="Grade (optional)" value={grade} onChangeText={setGrade} />
          <Button
            size="md"
            title="Save profile"
            disabled={ageInvalid}
            onPress={() => updateLearner(learner.id, { displayName: name.trim() || learner.displayName, fullName: learner.fullName && name.trim() !== learner.displayName ? name.trim() : learner.fullName, age: ageValue, grade: grade || undefined })}
          />
        </Card>

        <View onLayout={anchor('strengths')}>
          <SectionTitle>Strengths</SectionTitle>
        </View>
        <ChoiceChips multi options={strengthOptions.map((t) => ({ key: t, label: t }))} value={strengths} onChange={(v) => updateLearner(learner.id, { strengths: v as string[] })} />

        <SectionTitle>Buddy</SectionTitle>
        <ChoiceChips options={BUDDIES.map((b) => ({ key: b.id, label: b.name }))} value={learner.buddy} onChange={(v) => updateLearner(learner.id, { buddy: v as BuddyId })} />

        <SectionTitle>Presentation band</SectionTitle>
        <ChoiceChips
          options={(['A', 'B', 'C'] as PresentationBand[]).map((b) => ({ key: b, label: BANDS[b].name }))}
          value={learner.band}
          onChange={(v) => updateLearner(learner.id, { band: v as PresentationBand })}
        />
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: -6 }}>
          {`${BANDS[learner.band].summary} Bands describe presentation, not ability — change them any time.`}
        </Txt>

        <SectionTitle>Communication (all count equally)</SectionTitle>
        <ChoiceChips
          multi
          options={(
            [
              ['speech', 'Speech'],
              ['aac', 'AAC'],
              ['picture', 'Pictures'],
              ['gesture', 'Gesture / sign'],
              ['tap', 'Tap'],
              ['typed', 'Typing'],
            ] as [Modality, string][]
          ).map(([key, label]) => ({ key, label }))}
          value={a.communication}
          onChange={(v) => updateAccess(learner.id, { communication: v as Modality[] })}
        />
        <Card>
          <ListRow
            iconNode={<TalkPicture symbol="speech-balloon" size={40} />}
            title="Talk Board"
            subtitle="Picture words, own photos and voice"
            onPress={() => router.push({ pathname: '/coach/learner/[id]/talk', params: { id: learner.id } })}
          />
        </Card>

        <SectionTitle>Presentation</SectionTitle>
        <ChoiceChips
          options={[
            { key: 'audioVisual', label: 'Audio + visual' },
            { key: 'visualFirst', label: 'Visual-first', note: 'Coming soon', disabled: true },
            { key: 'iconFirst', label: 'Icon-first' },
            { key: 'modelFirst', label: 'Model-first', note: 'Coming soon', disabled: true },
            { key: 'minimalText', label: 'Minimal text', note: 'Coming soon', disabled: true },
            { key: 'textAudio', label: 'Text + audio' },
          ]}
          value={a.presentation}
          onChange={(v) => updateAccess(learner.id, { presentation: v as AccessProfile['presentation'] })}
        />
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          <Row label="Read instructions aloud" sub="Uses the device voice" value={a.readAloud} onChange={(v) => updateAccess(learner.id, { readAloud: v })} />
        </Card>

        <SectionTitle>Processing time</SectionTitle>
        <ChoiceChips
          options={[
            { key: 'standard', label: 'Standard wait' },
            { key: 'extended', label: 'Extended wait' },
            { key: 'noTimer', label: 'No timers' },
          ]}
          value={a.processing}
          onChange={(v) => updateAccess(learner.id, { processing: v as AccessProfile['processing'] })}
        />

        <View onLayout={anchor('sensory')}>
          <SectionTitle>Sensory</SectionTitle>
        </View>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          <Row label="Sound effects" value={a.sensory.soundEffects} onChange={(v) => setSensory({ soundEffects: v })} />
          <Row label="Music" value={a.sensory.music} onChange={(v) => setSensory({ music: v })} soon />
          <Row label="Haptics" value={a.sensory.haptics} onChange={(v) => setSensory({ haptics: v })} />
          <Row label="Background motion" sub="Drifting clouds, swaying trees" value={a.sensory.backgroundMotion} onChange={(v) => setSensory({ backgroundMotion: v })} />
          <Row label="Reduced visual detail" value={a.sensory.visualDensity === 'reduced'} onChange={(v) => setSensory({ visualDensity: v ? 'reduced' : 'standard' })} soon />
        </Card>
        <Txt v="label" color={colors.ink} style={{ marginTop: 12, marginBottom: 6 }}>
          Animation
        </Txt>
        <ChoiceChips
          options={[
            { key: 'full', label: 'Full' },
            { key: 'gentle', label: 'Gentle' },
            { key: 'off', label: 'Still' },
          ]}
          value={a.sensory.animation}
          onChange={(v) => setSensory({ animation: v as AccessProfile['sensory']['animation'] })}
        />
        <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
          Celebrations
        </Txt>
        <ChoiceChips
          options={[
            { key: 'full', label: 'Big' },
            { key: 'gentle', label: 'Gentle' },
            { key: 'minimal', label: 'Minimal' },
          ]}
          value={a.sensory.celebration}
          onChange={(v) => setSensory({ celebration: v as AccessProfile['sensory']['celebration'] })}
        />

        <SectionTitle>Motor</SectionTitle>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          <Row label="Large targets" value={a.motor.largeTargets} onChange={(v) => setMotor({ largeTargets: v })} soon />
          <Row label="No dragging (tap only)" value={a.motor.noDrag} onChange={(v) => setMotor({ noDrag: v })} soon />
          <Row label="Simplified gestures" value={a.motor.simplifiedGestures} onChange={(v) => setMotor({ simplifiedGestures: v })} soon />
        </Card>

        <SectionTitle>Transitions</SectionTitle>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          <Row label="Visual schedule" value={a.transitions.visualSchedule} onChange={(v) => setTransitions({ visualSchedule: v })} soon />
          <Row label="First-Then cards" value={a.transitions.firstThen} onChange={(v) => setTransitions({ firstThen: v })} />
          <Row label="One more turn" value={a.transitions.oneMoreTurn} onChange={(v) => setTransitions({ oneMoreTurn: v })} soon />
          <Row label="Countdowns" value={a.transitions.countdown} onChange={(v) => setTransitions({ countdown: v })} soon />
          <Row label="Explicit All Done" value={a.transitions.explicitAllDone} onChange={(v) => setTransitions({ explicitAllDone: v })} soon />
        </Card>
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: 10 }}>
          Settings marked “Coming soon” aren’t used by the child’s experience yet, so they stay off for now.
        </Txt>
      </ScrollView>
    </Screen>
  );
}

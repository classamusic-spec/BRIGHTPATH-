import { useState } from 'react';
import { View } from 'react-native';

import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { BUDDIES } from '@/components/kid/Buddy';
import { Button, Card, Header, Screen, Toggle, Txt } from '@/components/ui';
import { BANDS } from '@/engine/bands';
import type { AccessProfile, BuddyId, Modality, PresentationBand } from '@/engine/types';
import { useApp } from '@/store';
import { colors } from '@/theme';

function Row({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Txt v="label" color={colors.ink}>
          {label}
        </Txt>
        {sub ? (
          <Txt v="caption" color={colors.textMuted}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

/**
 * Child Profile & Access Profile editor (Framework §9). Changes the actual
 * experience: sensory load, wait time, communication, presentation band.
 */
export default function ChildProfile() {
  const learner = useRouteLearner();
  const updateLearner = useApp((s) => s.updateLearner);
  const updateAccess = useApp((s) => s.updateAccess);
  const [name, setName] = useState(learner.displayName);
  const [age, setAge] = useState(learner.age ? String(learner.age) : '');
  const [grade, setGrade] = useState(learner.grade ?? '');
  const a = learner.access;
  const setSensory = (patch: Partial<AccessProfile['sensory']>) => updateAccess(learner.id, { sensory: { ...a.sensory, ...patch } });
  const setMotor = (patch: Partial<AccessProfile['motor']>) => updateAccess(learner.id, { motor: { ...a.motor, ...patch } });
  const setTransitions = (patch: Partial<AccessProfile['transitions']>) => updateAccess(learner.id, { transitions: { ...a.transitions, ...patch } });

  return (
    <Screen header={<Header title="Child Profile" />}>
      <Card style={{ padding: 16 }}>
        <TextField label="Display name" value={name} onChangeText={setName} />
        <TextField label="Age (optional)" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <TextField label="Grade (optional)" value={grade} onChangeText={setGrade} />
        <Button
          size="md"
          title="Save profile"
          onPress={() => updateLearner(learner.id, { displayName: name.trim() || learner.displayName, fullName: learner.fullName && name.trim() !== learner.displayName ? name.trim() : learner.fullName, age: age ? Number(age) : undefined, grade: grade || undefined })}
        />
      </Card>

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

      <SectionTitle>Presentation</SectionTitle>
      <ChoiceChips
        options={[
          { key: 'audioVisual', label: 'Audio + visual' },
          { key: 'visualFirst', label: 'Visual-first' },
          { key: 'iconFirst', label: 'Icon-first' },
          { key: 'modelFirst', label: 'Model-first' },
          { key: 'minimalText', label: 'Minimal text' },
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

      <SectionTitle>Sensory</SectionTitle>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <Row label="Sound effects" value={a.sensory.soundEffects} onChange={(v) => setSensory({ soundEffects: v })} />
        <Row label="Music" value={a.sensory.music} onChange={(v) => setSensory({ music: v })} />
        <Row label="Haptics" value={a.sensory.haptics} onChange={(v) => setSensory({ haptics: v })} />
        <Row label="Background motion" sub="Drifting clouds, swaying trees" value={a.sensory.backgroundMotion} onChange={(v) => setSensory({ backgroundMotion: v })} />
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
        <Row label="Large targets" value={a.motor.largeTargets} onChange={(v) => setMotor({ largeTargets: v })} />
        <Row label="No dragging (tap only)" value={a.motor.noDrag} onChange={(v) => setMotor({ noDrag: v })} />
        <Row label="Simplified gestures" value={a.motor.simplifiedGestures} onChange={(v) => setMotor({ simplifiedGestures: v })} />
      </Card>

      <SectionTitle>Transitions</SectionTitle>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <Row label="Visual schedule" value={a.transitions.visualSchedule} onChange={(v) => setTransitions({ visualSchedule: v })} />
        <Row label="First-Then cards" value={a.transitions.firstThen} onChange={(v) => setTransitions({ firstThen: v })} />
        <Row label="One more turn" value={a.transitions.oneMoreTurn} onChange={(v) => setTransitions({ oneMoreTurn: v })} />
        <Row label="Countdowns" sub="Off by default — timers are never required" value={a.transitions.countdown} onChange={(v) => setTransitions({ countdown: v })} />
        <Row label="Explicit All Done" value={a.transitions.explicitAllDone} onChange={(v) => setTransitions({ explicitAllDone: v })} />
      </Card>
      <View style={{ height: 20 }} />
    </Screen>
  );
}

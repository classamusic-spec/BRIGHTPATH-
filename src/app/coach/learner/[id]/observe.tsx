import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon } from '@/components/icons/Icon';
import { Tree } from '@/components/scenery/elements';
import { Appear, Button, Card, CheckBadge, Header, Screen, StatusFace, Tap, Txt } from '@/components/ui';
import { SUPPORT_LABELS } from '@/engine/evidence';
import { AREA_LABEL } from '@/engine/summary';
import type { Outcome, Setting, SkillArea, SupportLevel, Valence } from '@/engine/types';
import { successHaptic } from '@/lib/feedback';
import { useApp } from '@/store';
import { useLearnerGoals } from '@/store/derived';
import { colors, radius, tones } from '@/theme';

const VALENCE: { key: Valence; label: string; tone: 'mint' | 'lavender' | 'blush' }[] = [
  { key: 'positive', label: 'Positive', tone: 'mint' },
  { key: 'neutral', label: 'Neutral', tone: 'lavender' },
  { key: 'challenging', label: 'Challenging', tone: 'blush' },
];

function SceneThumb() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={120} height={90} fill="#CFE9FC" />
      <Path d="M 0 60 C 30 50 70 52 120 58 L 120 90 L 0 90 Z" fill="#A9DE84" />
      <Tree x={50} y={76} h={56} />
      <Tree x={78} y={78} h={42} tone="light" />
    </Svg>
  );
}

/**
 * 28 · Observation Entry — records an opportunity with source, context,
 * support and outcome (Framework §34) behind a friendly, fast form.
 */
export default function ObservationEntry() {
  const learner = useRouteLearner();
  const { goal: goalParam } = useLocalSearchParams<{ goal?: string }>();
  const goals = useLearnerGoals(learner.id).filter((g) => g.status === 'active');
  const record = useApp((s) => s.recordObservation);
  const consentPhotos = useApp((s) => s.consent.photos);
  const [valence, setValence] = useState<Valence>('positive');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [goalId, setGoalId] = useState<string>(goalParam ?? goals[0]?.id ?? 'none');
  const [setting, setSetting] = useState<Setting>('home');
  const [support, setSupport] = useState<SupportLevel>(1);
  const [outcome, setOutcome] = useState<Outcome>('independent');
  const [saved, setSaved] = useState(false);
  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);
  const [area, setArea] = useState<SkillArea>(goal?.skillArea ?? 'communication');

  const pick = async (camera: boolean) => {
    try {
      const res = camera
        ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, mediaTypes: ['images'] });
      if (!res.canceled && res.assets[0]) setPhotos((p) => [...p, res.assets[0].uri].slice(-3));
    } catch {
      // Camera unavailable (e.g. web without camera) — ignore.
    }
  };

  const save = () => {
    record({
      learnerId: learner.id,
      goalId: goal?.id,
      skillArea: goal?.skillArea ?? area,
      source: setting === 'school' ? 'school' : setting === 'social' ? 'community' : 'home',
      at: new Date().toISOString(),
      context: { setting },
      quality: outcome === 'accessLimited' ? 'accessLimited' : 'valid',
      outcome,
      supportLevel: outcome === 'independent' ? 1 : support,
      modality: 'observed',
      valence,
      title: setting === 'outdoors' ? 'Outdoors' : setting === 'school' ? 'At School' : setting === 'social' ? 'Out & About' : 'At Home',
      note: text.trim() || undefined,
      photos,
      realWorld: true,
      tags: [],
    });
    successHaptic();
    setSaved(true);
    setTimeout(() => router.back(), 700);
  };

  return (
    <Screen header={<Header title="Add an Observation" />} footer={<Button title={saved ? 'Saved ✓' : 'Save Observation'} onPress={save} disabled={saved} />}>
      <Card style={{ padding: 16 }}>
        <Txt v="heading" color="#1320C4" style={{ fontSize: 22, marginBottom: 12 }}>
          What did you notice?
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {VALENCE.map((v) => {
            const on = valence === v.key;
            return (
              <Tap key={v.key} onPress={() => setValence(v.key)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={v.label} style={[styles.val, { backgroundColor: tones[v.tone].bg, borderColor: on ? colors.primary : 'transparent' }]}>
                {v.key === 'positive' ? <StatusFace kind="good" size={58} /> : v.key === 'neutral' ? <Icon name="bars" size={56} /> : <Icon name="heart" size={58} />}
                <Txt v="label" color={colors.text} style={{ marginTop: 6, fontSize: 16 }}>
                  {v.label}
                </Txt>
                {on ? <CheckBadge size={30} style={{ position: 'absolute', top: -8, right: -6 }} /> : null}
              </Tap>
            );
          })}
        </View>
        <View style={{ marginTop: 14 }}>
          <TextField value={text} onChangeText={setText} placeholder="Share what happened…" multiline maxLength={500} />
        </View>
        <Txt v="label" color="#1320C4" style={{ fontSize: 17, marginBottom: 8 }}>
          Add Photos (optional)
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tap onPress={() => pick(true)} disabled={!consentPhotos} accessibilityLabel="Take a photo" style={[styles.photo, { backgroundColor: '#E7EBF3' }]}>
            <Icon name="camera" size={40} color="#3A4A7C" />
          </Tap>
          {photos.length ? (
            photos.map((u) => <Image key={u} source={{ uri: u }} style={styles.photo} accessibilityLabel="Attached photo" />)
          ) : (
            <View style={[styles.photo, { overflow: 'hidden' }]} accessibilityLabel="Example photo" accessible>
              <SceneThumb />
            </View>
          )}
          <Tap onPress={() => pick(false)} disabled={!consentPhotos} accessibilityLabel="Add a photo from library" style={[styles.photo, { backgroundColor: '#EAF0FA' }]}>
            <Icon name="plus" size={36} color={colors.cobalt} />
          </Tap>
        </View>
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
          Photos stay on this device. Please avoid faces.
        </Txt>
      </Card>

      <SectionTitle>Which goal? (optional)</SectionTitle>
      <ChoiceChips options={[{ key: 'none', label: 'General' }, ...goals.map((g) => ({ key: g.id, label: g.title }))]} value={goalId} onChange={(v) => setGoalId(v as string)} />
      {!goal ? (
        <ChoiceChips options={(Object.keys(AREA_LABEL) as SkillArea[]).map((a) => ({ key: a, label: AREA_LABEL[a] }))} value={area} onChange={(v) => setArea(v as SkillArea)} />
      ) : null}
      <SectionTitle>Where?</SectionTitle>
      <ChoiceChips
        options={[
          { key: 'home', label: 'Home' },
          { key: 'school', label: 'School' },
          { key: 'social', label: 'Social' },
          { key: 'outdoors', label: 'Outdoors' },
        ]}
        value={setting}
        onChange={(v) => setSetting(v as Setting)}
      />
      <SectionTitle>How did it go?</SectionTitle>
      <ChoiceChips
        options={[
          { key: 'independent', label: 'Independent' },
          { key: 'supported', label: 'With support' },
          { key: 'partial', label: 'Partly' },
          { key: 'notDemonstrated', label: 'Not yet' },
          { key: 'accessLimited', label: 'Access limited' },
        ]}
        value={outcome}
        onChange={(v) => setOutcome(v as Outcome)}
      />
      {outcome === 'supported' || outcome === 'partial' ? (
        <>
          <SectionTitle>Support used</SectionTitle>
          <ChoiceChips options={([2, 3, 4, 5, 6, 7] as SupportLevel[]).map((l) => ({ key: String(l), label: SUPPORT_LABELS[l] }))} value={String(support)} onChange={(v) => setSupport(Number(v) as SupportLevel)} />
        </>
      ) : null}
      {outcome === 'accessLimited' ? (
        <Card tone="sky" style={{ padding: 12 }}>
          <Txt v="bodySm">Access-limited moments stay visible but are never counted as a miss.</Txt>
        </Card>
      ) : null}
      <Txt v="caption" color={colors.textMuted} style={{ marginTop: 8, borderRadius: radius.sm }}>
        Tip: describe what you saw (“tapped Help after the visual cue”) rather than why (“was avoiding”).
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  val: { flex: 1, alignItems: 'center', borderRadius: radius.lg, paddingVertical: 14, borderWidth: 2.5 },
  photo: { flex: 1, height: 96, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

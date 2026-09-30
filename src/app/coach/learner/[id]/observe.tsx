import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Platform, StyleSheet, View } from 'react-native';

import { withRouteLearner } from '@/components/coach/Kit';
import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { Icon } from '@/components/icons/Icon';
import { Button, Card, CheckBadge, Header, Screen, StatusFace, Tap, Txt } from '@/components/ui';
import { SUPPORT_LABELS } from '@/engine/evidence';
import { AREA_LABEL } from '@/engine/summary';
import type { Learner, Outcome, Setting, SkillArea, SupportLevel, Valence } from '@/engine/types';
import { successHaptic } from '@/lib/feedback';
import { goBackOr } from '@/lib/nav';
import { useApp } from '@/store';
import { useLearnerGoals } from '@/store/derived';
import { colors, radius, tones } from '@/theme';

const VALENCE: { key: Valence; label: string; tone: 'mint' | 'lavender' | 'blush' }[] = [
  { key: 'positive', label: 'Positive', tone: 'mint' },
  { key: 'neutral', label: 'Neutral', tone: 'lavender' },
  { key: 'challenging', label: 'Challenging', tone: 'blush' },
];

/**
 * 28 · Observation Entry — records an opportunity with source, context,
 * support and outcome (Framework §34) behind a friendly, fast form.
 */
export default withRouteLearner(ObservationEntry);

function ObservationEntry({ learner }: { learner: Learner }) {
  const { goal: goalParam } = useLocalSearchParams<{ goal?: string }>();
  const goals = useLearnerGoals(learner.id).filter((g) => g.status === 'active');
  const record = useApp((s) => s.recordObservation);
  const consentPhotos = useApp((s) => s.consent.photos);
  const [valence, setValence] = useState<Valence>('positive');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [goalId, setGoalId] = useState<string>(goalParam ?? 'none');
  const [setting, setSetting] = useState<Setting>('home');
  const [support, setSupport] = useState<SupportLevel>(1);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);
  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);
  const [area, setArea] = useState<SkillArea>(goal?.skillArea ?? 'communication');

  const pick = async (camera: boolean) => {
    setError(null);
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setCameraDenied(true);
          return;
        }
        setCameraDenied(false);
      }
      const res = camera
        ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, mediaTypes: ['images'] });
      if (!res.canceled && res.assets[0]) setPhotos((p) => [...p, res.assets[0].uri].slice(-3));
    } catch (e) {
      setError(camera ? 'The camera couldn’t open on this device. You can add a photo from your library instead.' : `Couldn’t add that photo${e instanceof Error && e.message ? ` (${e.message})` : ''}.`);
    }
  };

  const save = () => {
    if (!outcome) return;
    setError(null);
    try {
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
    } catch (e) {
      setError(`The observation wasn’t saved${e instanceof Error && e.message ? ` (${e.message})` : ''}. Please try again.`);
      return;
    }
    successHaptic();
    setSaved(true);
    // Leave only if the adult is still here (not if they already navigated away).
    setTimeout(() => {
      if (focusedRef.current) goBackOr(`/coach/learner/${learner.id}`);
    }, 700);
  };

  return (
    <Screen header={<Header title="Add an Observation" subtitle={`For ${learner.displayName}`} />} footer={<Button title={saved ? 'Saved ✓' : outcome ? 'Save Observation' : 'Choose how it went'} onPress={save} disabled={saved || !outcome} />}>
      <Card style={{ padding: 16 }}>
        <Txt v="heading" color={colors.heading} style={{ fontSize: 22, marginBottom: 12 }}>
          What did you notice?
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {VALENCE.map((v) => {
            const on = valence === v.key;
            return (
              <Tap key={v.key} onPress={() => setValence(v.key)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={v.label} style={[styles.val, { backgroundColor: tones[v.tone].bg, borderColor: on ? colors.primary : 'transparent' }]}>
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
        <Txt v="label" color={colors.heading} style={{ fontSize: 17, marginBottom: 8 }}>
          Add Photos (optional)
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tap onPress={() => pick(true)} disabled={!consentPhotos} accessibilityLabel="Take a photo" style={[styles.photo, { backgroundColor: '#E7EBF3' }]}>
            <Icon name="camera" size={40} color="#3A4A7C" />
          </Tap>
          {photos.length ? (
            photos.map((u) => <Image key={u} source={{ uri: u }} style={styles.photo} accessibilityLabel="Attached photo" />)
          ) : (
            <View style={[styles.photo, styles.empty]} accessible accessibilityLabel="No photo yet">
              <Txt v="caption" color={colors.textMuted}>
                No photo yet
              </Txt>
            </View>
          )}
          <Tap onPress={() => pick(false)} disabled={!consentPhotos} accessibilityLabel="Add a photo from library" style={[styles.photo, { backgroundColor: '#EAF0FA' }]}>
            <Icon name="plus" size={36} color={colors.cobalt} />
          </Tap>
        </View>
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
          {consentPhotos ? 'Photos stay on this device. Please avoid faces.' : 'Photos are turned off in Privacy & Data.'}
        </Txt>
        {cameraDenied ? (
          <View style={[styles.notice, { backgroundColor: colors.skySoft }]} accessibilityRole="alert">
            <Txt v="bodySm" color={colors.text}>
              BrightPath doesn’t have permission to use the camera.
            </Txt>
            {Platform.OS !== 'web' ? (
              <Tap onPress={() => Linking.openSettings()} accessibilityRole="link" accessibilityLabel="Open Settings to allow the camera" style={{ paddingVertical: 8 }}>
                <Txt v="label" color={colors.primaryDeep}>
                  Open Settings
                </Txt>
              </Tap>
            ) : null}
          </View>
        ) : null}
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
        value={outcome ?? ([] as Outcome[])}
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
      {error ? (
        <View style={[styles.notice, { marginTop: 12 }]} accessibilityRole="alert">
          <Txt v="bodySm" color={colors.dangerText}>
            {error}
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  val: { flex: 1, alignItems: 'center', borderRadius: radius.lg, paddingVertical: 14, borderWidth: 2.5 },
  photo: { flex: 1, height: 96, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#C6D3EA', backgroundColor: '#F7FAFE' },
  notice: { marginTop: 10, backgroundColor: colors.blushSoft, borderRadius: radius.md, padding: 12 },
});

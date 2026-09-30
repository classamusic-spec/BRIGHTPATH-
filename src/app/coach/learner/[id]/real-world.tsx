import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { withRouteLearner } from '@/components/coach/Kit';
import { EvidenceRow } from '@/components/coach/EvidenceRow';
import { ChoiceChips, TextField } from '@/components/coach/Form';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ParkScene } from '@/components/scenery/Scenes';
import { Appear, Button, Card, Chip, Header, IconTile, Screen, SegmentedTabs, Sheet, Tap, Txt } from '@/components/ui';
import type { Learner, Outcome, SupportLevel } from '@/engine/types';
import { announce } from '@/lib/announce';
import { successHaptic } from '@/lib/feedback';
import { useApp } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useLearnerObservations } from '@/store/derived';
import { colors, radius } from '@/theme';

const TAG_META: Record<string, { tone: 'sky' | 'blush' | 'butter' | 'mint' | 'lavender'; icon: IconName }> = {
  'Social Skills': { tone: 'sky', icon: 'runner' },
  Kindness: { tone: 'blush', icon: 'heart' },
  Independence: { tone: 'butter', icon: 'star' },
  Communication: { tone: 'mint', icon: 'chat' },
  'Calm Tools': { tone: 'lavender', icon: 'sprout' },
};

const QUEST_OUTCOMES: { key: Outcome | 'none'; label: string; support: SupportLevel }[] = [
  { key: 'none', label: 'Didn’t come up', support: 1 },
  { key: 'independent', label: 'Independent', support: 1 },
  { key: 'supported', label: 'Environmental cue', support: 2 },
  { key: 'supported', label: 'Visual cue', support: 3 },
  { key: 'supported', label: 'Gesture', support: 4 },
  { key: 'supported', label: 'Model', support: 5 },
  { key: 'supported', label: 'Brief words', support: 6 },
  { key: 'supported', label: 'Together', support: 7 },
  { key: 'partial', label: 'Tried part of it', support: 5 },
  { key: 'notDemonstrated', label: 'Not yet', support: 7 },
  { key: 'accessLimited', label: 'Access limited', support: 1 },
];

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `Today, ${time}` : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

/** 33 · Real-World Observation — where in-app practice meets real life (§38). */
export default withRouteLearner(RealWorldObservation);

function RealWorldObservation({ learner }: { learner: Learner }) {
  const obs = useLearnerObservations(learner.id);
  const quests = useApp(useShallow((s) => s.quests.filter((q) => q.learnerId === learner.id && q.status === 'open')));
  const record = useApp((s) => s.recordObservation);
  const resolveQuest = useApp((s) => s.resolveQuest);
  const [tab, setTab] = useState<'observe' | 'history'>('observe');
  const [note, setNote] = useState('');
  const [tagSheet, setTagSheet] = useState(false);
  const [voice, setVoice] = useState(false);
  const [questOpen, setQuestOpen] = useState<string | null>(null);
  // Index into QUEST_OUTCOMES, or null until the adult picks one.
  const [questChoice, setQuestChoice] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const annotate = useApp((s) => s.annotateObservation);
  const realWorld = useMemo(() => obs.filter((o) => o.realWorld).sort((a, b) => (a.at < b.at ? 1 : -1)), [obs]);
  const latest = realWorld[0];
  const tags = useMemo(() => (latest?.tags ?? []).filter((t) => TAG_META[t]), [latest]);
  const quest = quests.find((q) => q.id === questOpen);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // Notes and tags are added to the same moment; they never create a second observation.
  const saveNote = () => {
    if (!latest || !note.trim()) return;
    annotate(latest.id, { note: note.trim() });
    successHaptic();
    setNote('');
    setToast('Note added');
    announce('Note added');
  };
  const addTags = (next: string[]) => {
    if (!latest) return;
    const added = next.filter((t) => !latest.tags.includes(t));
    if (!added.length) return;
    annotate(latest.id, { tags: added });
    announce(`Tag added: ${added.join(', ')}`);
  };

  return (
    <Screen header={<Header title="Real-World Observation" />}>
      <SegmentedTabs
        items={[
          { key: 'observe', label: 'Observe' },
          { key: 'history', label: 'History' },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 14 }}
      />

      {tab === 'observe' && (
        <>
          {quests.length ? (
            <Card tone="butter" style={{ padding: 14, marginBottom: 12 }}>
              <Txt v="subheading" color={colors.ink}>{`Real-World Quest${quests.length > 1 ? 's' : ''} to check`}</Txt>
              {quests.map((q) => (
                <Tap key={q.id} onPress={() => setQuestOpen(q.id)} accessibilityLabel={`Record ${q.quest}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 12 }}>
                  <Icon name="star" size={28} />
                  <Txt v="body" style={{ flex: 1 }}>
                    {q.quest}
                  </Txt>
                  <Icon name="chevronRight" size={20} color={colors.cobalt} />
                </Tap>
              ))}
            </Card>
          ) : null}
          {latest ? (
            <Appear>
              <Card style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <IconTile tone="sky" size={58} radiusPx={16}>
                    <Icon name="tree" size={40} />
                  </IconTile>
                  <View style={{ flex: 1 }}>
                    <Txt v="heading" color={colors.heading} style={{ fontSize: 20, lineHeight: 25 }} numberOfLines={1}>
                      {latest.title ?? 'Real-world moment'}
                    </Txt>
                    <Txt v="body" color={colors.textSoft} style={{ fontSize: 15 }} numberOfLines={1}>
                      {when(latest.at)}
                    </Txt>
                  </View>
                  <View style={{ backgroundColor: latest.valence === 'challenging' ? colors.blushSoft : '#DDF6E6', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }}>
                    <Txt v="label" color={latest.valence === 'challenging' ? colors.alertText : colors.mintText} style={{ fontSize: 13.5 }}>
                      {latest.valence === 'challenging' ? 'Tricky Moment' : 'Positive Moment'}
                    </Txt>
                  </View>
                </View>
                <View style={{ height: 210, borderRadius: radius.lg, overflow: 'hidden', marginTop: 14 }}>
                  {latest.photos?.[0] ? <Image source={{ uri: latest.photos[0] }} style={{ flex: 1 }} resizeMode="cover" accessibilityLabel="Photo of this moment" /> : <ParkScene style={{ flex: 1 }} />}
                </View>
                {latest.note ? (
                  <Txt v="heading" color={colors.heading} style={{ marginTop: 12, fontSize: 21, lineHeight: 28, fontFamily: 'Nunito_700Bold' }}>
                    {latest.note}
                  </Txt>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: tags.length ? 12 : 0 }}>
                  {tags.map((t) => (
                    <Chip key={t} label={t} size="sm" tone={TAG_META[t]?.tone ?? 'blue'} icon={<Icon name={TAG_META[t]?.icon ?? 'star'} size={17} color={t === 'Social Skills' ? '#2F74E8' : undefined} />} />
                  ))}
                </View>
                <View style={{ marginTop: 12 }}>
                  <TextField value={note} onChangeText={setNote} placeholder="Add a note…" />
                  {note.trim() ? <Button size="md" title="Save note" onPress={saveNote} /> : null}
                  {toast ? (
                    <View style={{ alignSelf: 'center', backgroundColor: colors.mintSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginTop: 8 }}>
                      <Txt v="label" color={colors.mintText}>
                        {toast}
                      </Txt>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {(
                    [
                      ['camera', 'Photo', () => router.push({ pathname: '/coach/learner/[id]/observe', params: { id: learner.id } })],
                      ['mic', 'Voice', () => setVoice(true)],
                      ['doc', 'Note', () => router.push({ pathname: '/coach/learner/[id]/observe', params: { id: learner.id } })],
                      ['tag', 'Tag', () => setTagSheet(true)],
                    ] as [IconName, string, () => void][]
                  ).map(([icon, label, fn]) => (
                    <Tap key={label} onPress={fn} accessibilityLabel={label} style={styles.action}>
                      <Icon name={icon} size={40} color="#2F74E8" />
                      <Txt v="label" color={colors.text} style={{ marginTop: 4 }}>
                        {label}
                      </Txt>
                    </Tap>
                  ))}
                </View>
              </Card>
            </Appear>
          ) : (
            <Card style={{ padding: 16 }}>
              <Txt v="body">No real-world moments yet. Add one after a Real-World Quest.</Txt>
            </Card>
          )}
        </>
      )}

      {tab === 'history' && (
        <View style={{ gap: 10 }}>
          {realWorld.map((o) => (
            <EvidenceRow key={o.id} obs={o} />
          ))}
        </View>
      )}

      <Sheet visible={tagSheet} onClose={() => setTagSheet(false)} title="Tags" subtitle="Tags are added to this moment.">
        <ChoiceChips multi options={Object.keys(TAG_META).map((t) => ({ key: t, label: t, disabled: tags.includes(t) }))} value={tags} onChange={(v) => addTags(v as string[])} />
      </Sheet>
      <Sheet visible={voice} onClose={() => setVoice(false)} title="Voice notes" subtitle="BrightPath doesn’t store voice recordings.">
        <Txt v="body">Use your keyboard’s microphone (dictation) in the note field to speak your note — only the text is saved.</Txt>
      </Sheet>
      <Sheet visible={!!quest} onClose={() => setQuestOpen(null)} title="How did the quest go?" subtitle={quest?.quest}>
        <ChoiceChips options={QUEST_OUTCOMES.map((q, i) => ({ key: String(i), label: q.label }))} value={questChoice == null ? [] : String(questChoice)} onChange={(v) => setQuestChoice(Number(v))} />
        <Button
          title={questChoice == null ? 'Choose how it went' : 'Save'}
          disabled={questChoice == null}
          onPress={() => {
            if (!quest || questChoice == null) return;
            const choice = QUEST_OUTCOMES[questChoice];
            if (choice.key === 'none') {
              resolveQuest(quest.id, 'none');
            } else {
              const o = record({
                learnerId: learner.id,
                goalId: quest.goalId,
                skillArea: quest.skillArea,
                missionId: quest.missionId,
                source: quest.setting === 'school' ? 'school' : 'home',
                at: new Date().toISOString(),
                context: { setting: quest.setting },
                quality: choice.key === 'accessLimited' ? 'accessLimited' : 'valid',
                outcome: choice.key,
                supportLevel: choice.support,
                valence: choice.key === 'accessLimited' || choice.key === 'partial' ? 'neutral' : choice.key === 'notDemonstrated' ? 'challenging' : 'positive',
                title: quest.title,
                note: quest.quest,
                realWorld: true,
              });
              resolveQuest(quest.id, o.id);
            }
            successHaptic();
            setQuestOpen(null);
            setQuestChoice(null);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1, backgroundColor: '#EEF4FD', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 14 },
});

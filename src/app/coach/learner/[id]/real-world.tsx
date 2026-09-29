import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceChips, TextField } from '@/components/coach/Form';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ParkScene } from '@/components/scenery/Scenes';
import { Appear, Button, Card, Chip, Header, IconTile, Screen, SegmentedTabs, Sheet, Tap, Txt } from '@/components/ui';
import { OUTCOME_LABELS, SUPPORT_LABELS } from '@/engine/evidence';
import type { Outcome, SupportLevel } from '@/engine/types';
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
export default function RealWorldObservation() {
  const learner = useRouteLearner();
  const obs = useLearnerObservations(learner.id);
  const quests = useApp(useShallow((s) => s.quests.filter((q) => q.learnerId === learner.id && q.status === 'open')));
  const record = useApp((s) => s.recordObservation);
  const resolveQuest = useApp((s) => s.resolveQuest);
  const [tab, setTab] = useState<'observe' | 'history'>('observe');
  const [note, setNote] = useState('');
  const [tagSheet, setTagSheet] = useState(false);
  const [voice, setVoice] = useState(false);
  const [questOpen, setQuestOpen] = useState<string | null>(null);
  const [questChoice, setQuestChoice] = useState(1);
  const realWorld = useMemo(() => obs.filter((o) => o.realWorld).sort((a, b) => (a.at < b.at ? 1 : -1)), [obs]);
  const latest = realWorld[0];
  const [tags, setTags] = useState<string[]>(latest?.tags.filter((t) => TAG_META[t]) ?? ['Social Skills', 'Kindness', 'Independence']);
  const quest = quests.find((q) => q.id === questOpen);

  const saveNote = () => {
    if (!latest) return;
    record({
      learnerId: learner.id,
      goalId: latest.goalId,
      skillArea: latest.skillArea,
      source: latest.source,
      at: new Date().toISOString(),
      context: latest.context,
      quality: 'valid',
      outcome: latest.outcome,
      supportLevel: latest.supportLevel,
      valence: latest.valence,
      title: latest.title,
      note: note.trim(),
      tags,
      realWorld: true,
    });
    successHaptic();
    setNote('');
  };

  return (
    <Screen header={<Header title="Real-World Observation" titleSize="titleSm" />}>
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
              <Card style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconTile tone="sky" size={70} radiusPx={18}>
                    <Icon name="tree" size={48} />
                  </IconTile>
                  <View style={{ flex: 1 }}>
                    <Txt v="heading" color="#1320C4" style={{ fontSize: 21 }}>
                      {latest.title ?? 'Real-world moment'}
                    </Txt>
                    <Txt v="body" color={colors.textSoft}>
                      {when(latest.at)}
                    </Txt>
                  </View>
                  <View style={{ backgroundColor: latest.valence === 'challenging' ? colors.blushSoft : '#DDF6E6', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Txt v="label" color={latest.valence === 'challenging' ? '#C23A5C' : colors.mintDeep}>
                      {latest.valence === 'challenging' ? 'Tricky Moment' : 'Positive Moment'}
                    </Txt>
                  </View>
                </View>
                <View style={{ height: 210, borderRadius: radius.lg, overflow: 'hidden', marginTop: 14 }}>
                  <ParkScene style={{ flex: 1 }} />
                </View>
                <Txt v="heading" color="#1320C4" style={{ marginTop: 12, fontSize: 21, lineHeight: 28, fontFamily: 'Nunito_700Bold' }}>
                  {latest.note}
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {tags.map((t) => (
                    <Chip key={t} label={t} tone={TAG_META[t]?.tone ?? 'blue'} icon={<Icon name={TAG_META[t]?.icon ?? 'star'} size={22} color={t === 'Social Skills' ? '#2F74E8' : undefined} />} />
                  ))}
                </View>
                <View style={{ marginTop: 12 }}>
                  <TextField value={note} onChangeText={setNote} placeholder="Add a note…" />
                  {note.trim() ? <Button size="md" title="Save note" onPress={saveNote} /> : null}
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
            <Card key={o.id} style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt v="subheading" color={colors.ink}>
                  {o.title ?? o.context.setting}
                </Txt>
                <Txt v="caption" color={colors.textMuted}>
                  {when(o.at)}
                </Txt>
              </View>
              {o.note ? (
                <Txt v="body" color={colors.textSoft}>
                  {o.note}
                </Txt>
              ) : null}
              <Txt v="caption" color={colors.mintDeep}>{`${OUTCOME_LABELS[o.outcome]} · ${SUPPORT_LABELS[o.supportLevel]} · ${o.source}`}</Txt>
            </Card>
          ))}
        </View>
      )}

      <Sheet visible={tagSheet} onClose={() => setTagSheet(false)} title="Tags">
        <ChoiceChips multi options={Object.keys(TAG_META).map((t) => ({ key: t, label: t }))} value={tags} onChange={(v) => setTags(v as string[])} />
      </Sheet>
      <Sheet visible={voice} onClose={() => setVoice(false)} title="Voice notes" subtitle="BrightPath doesn’t store voice recordings.">
        <Txt v="body">Use your keyboard’s microphone (dictation) in the note field to speak your note — only the text is saved.</Txt>
      </Sheet>
      <Sheet visible={!!quest} onClose={() => setQuestOpen(null)} title="How did the quest go?" subtitle={quest?.quest}>
        <ChoiceChips options={QUEST_OUTCOMES.map((q, i) => ({ key: String(i), label: q.label }))} value={String(questChoice)} onChange={(v) => setQuestChoice(Number(v))} />
        <Button
          title="Save"
          onPress={() => {
            if (!quest) return;
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
                valence: choice.key === 'accessLimited' ? 'neutral' : 'positive',
                title: quest.title,
                note: quest.quest,
                realWorld: true,
              });
              resolveQuest(quest.id, o.id);
            }
            successHaptic();
            setQuestOpen(null);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1, backgroundColor: '#EEF4FD', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 14 },
});

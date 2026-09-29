import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Appear, Button, Card, Header, IconTile, Screen, Tap, Txt } from '@/components/ui';
import { FOCUS_OPTIONS, templatesForFocus, type FocusOption, type GoalTemplate } from '@/content/curriculum';
import { BANDS } from '@/engine/bands';
import type { Modality, PresentationBand, Setting } from '@/engine/types';
import { selectHaptic } from '@/lib/feedback';
import { selectLearner, useApp } from '@/store';
import { colors } from '@/theme';

const FOCUS_ICON: Record<FocusOption['id'], IconName> = {
  communication: 'chatOrange',
  feelings: 'heart',
  routines: 'calendar',
  independence: 'personBlue',
  new: 'star',
};

/**
 * 26 · Create a Growth Goal — Goal Setup Protocol (Framework §23):
 * functional context, observable action, accepted modalities, success,
 * priority contexts, band and mission family before a goal becomes Active.
 */
export default function CreateGoal() {
  const { learner: learnerParam } = useLocalSearchParams<{ learner?: string }>();
  const learner = useApp((s) => s.learners.find((l) => l.id === learnerParam) ?? selectLearner(s));
  const addGoal = useApp((s) => s.addGoal);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [focus, setFocus] = useState<FocusOption['id'] | null>(null);
  const [tpl, setTpl] = useState<GoalTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [action, setAction] = useState('');
  const [context, setContext] = useState('');
  const [success, setSuccess] = useState('');
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [contexts, setContexts] = useState<Setting[]>([]);
  const [band, setBand] = useState<PresentationBand>(learner.band);
  const [weeks, setWeeks] = useState('10');
  const [notes, setNotes] = useState('');
  const templates = useMemo(() => (focus ? templatesForFocus(focus) : []), [focus]);

  const pickTemplate = (t: GoalTemplate) => {
    setTpl(t);
    setTitle(t.title);
    setAction(t.observableAction);
    setContext(t.functionalContext);
    setSuccess(t.successDefinition);
    setModalities(t.modalities);
    setContexts(t.contexts);
  };

  const create = () => {
    if (!tpl) return;
    const id = addGoal({
      learnerId: learner.id,
      title: title.trim() || tpl.title,
      family: tpl.family,
      skillArea: tpl.skillArea,
      templateId: tpl.id,
      observableAction: action,
      functionalContext: context,
      acceptedModalities: modalities,
      successDefinition: success,
      priorityContexts: contexts,
      band,
      gameEngine: tpl.engine,
      targetDate: new Date(Date.now() + Number(weeks || 10) * 7 * 24 * 3600 * 1000).toISOString(),
      status: 'active',
      notes,
      supportLevel: 5,
      protectedSupports: learner.access.communication.includes('aac') ? ['AAC'] : [],
      realWorldRequired: tpl.realWorld,
      flags: {},
      missionIds: tpl.missionIds,
    });
    router.replace({ pathname: '/coach/goal/[id]', params: { id } });
  };

  const ready = action.trim() && success.trim() && modalities.length > 0;

  return (
    <Screen
      header={<Header title="Create a Growth Goal" onBack={step > 1 ? () => setStep((s) => (s - 1) as 1 | 2) : undefined} />}
      footer={
        step === 1 ? (
          <Button title="Next" disabled={!focus} onPress={() => setStep(2)} />
        ) : step === 2 ? (
          <Button title="Next" disabled={!tpl} onPress={() => setStep(3)} />
        ) : (
          <Button title="Create Goal" disabled={!ready} onPress={create} />
        )
      }
    >
      {step === 1 && (
        <>
          <Txt v="heading" color="#1320C4" style={{ fontSize: 22, marginBottom: 12 }}>
            What would you like to focus on?
          </Txt>
          <View style={{ gap: 12 }}>
            {FOCUS_OPTIONS.map((f, i) => {
              const on = focus === f.id;
              return (
                <Appear key={f.id} delay={i * 50}>
                  <Card
                    onPress={() => {
                      selectHaptic();
                      setFocus(f.id);
                      setTpl(null);
                    }}
                    selected={on}
                    accessibilityLabel={f.label}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 }}
                  >
                    <IconTile tone={f.tone} size={64} radiusPx={18}>
                      <Icon name={FOCUS_ICON[f.id]} size={46} />
                    </IconTile>
                    <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 20 }}>
                      {f.label}
                    </Txt>
                    <Icon name="chevronRight" size={24} color={colors.cobalt} />
                  </Card>
                </Appear>
              );
            })}
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Txt v="heading" color="#1320C4" style={{ fontSize: 23, marginBottom: 4 }}>
            Choose a starting point
          </Txt>
          <Txt v="body" color={colors.textSoft} style={{ marginBottom: 12 }}>
            Every template is observable and agency-preserving. You can edit it next.
          </Txt>
          <View style={{ gap: 10 }}>
            {templates.map((t) => (
              <Card key={t.id} onPress={() => pickTemplate(t)} selected={tpl?.id === t.id} style={{ padding: 14 }} accessibilityLabel={t.title}>
                <Txt v="subheading" color={colors.ink}>
                  {t.title}
                </Txt>
                <Txt v="bodySm" color={colors.textSoft} style={{ marginTop: 2 }}>
                  {t.observableAction}
                </Txt>
              </Card>
            ))}
          </View>
        </>
      )}

      {step === 3 && tpl && (
        <>
          <TextField label="Goal name" value={title} onChangeText={setTitle} />
          <TextField label="Observable action" value={action} onChangeText={setAction} multiline />
          <TextField label="Functional context" value={context} onChangeText={setContext} />
          <TextField label="What success means" value={success} onChangeText={setSuccess} multiline />
          <SectionTitle>Accepted ways to show it</SectionTitle>
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
                ['observed', 'Observed action'],
              ] as [Modality, string][]
            ).map(([key, label]) => ({ key, label }))}
            value={modalities}
            onChange={(v) => setModalities(v as Modality[])}
          />
          <SectionTitle>Priority places</SectionTitle>
          <ChoiceChips
            multi
            options={[
              { key: 'home', label: 'Home' },
              { key: 'school', label: 'School' },
              { key: 'social', label: 'Social' },
              { key: 'outdoors', label: 'Outdoors' },
            ]}
            value={contexts}
            onChange={(v) => setContexts(v as Setting[])}
          />
          <SectionTitle>Presentation band</SectionTitle>
          <ChoiceChips options={(['A', 'B', 'C'] as PresentationBand[]).map((b) => ({ key: b, label: BANDS[b].name }))} value={band} onChange={(v) => setBand(v as PresentationBand)} />
          <TextField label="Target (weeks)" value={weeks} onChangeText={setWeeks} keyboardType="number-pad" />
          <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
          <Card tone="mint" style={{ padding: 14 }}>
            <Txt v="bodySm" color={colors.text}>
              BrightPath starts with modelling and gathers 6–12 valid opportunities across at least two sessions before making a normal recommendation.
            </Txt>
          </Card>
        </>
      )}
      <Tap onPress={() => router.back()} accessibilityLabel="Cancel" style={{ alignSelf: 'center', padding: 14 }}>
        <Txt v="label" color={colors.textMuted}>
          Cancel
        </Txt>
      </Tap>
    </Screen>
  );
}

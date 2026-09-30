import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { AidenFace } from '@/components/characters/People';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Appear, Button, CheckBadge, Header, IconTile, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import type { ArtId, ChoiceOption, MissionStep } from '@/content/types';
import { choicesForBand } from '@/engine/bands';
import type { Learner, SupportLevel } from '@/engine/types';
import { announce } from '@/lib/announce';
import { selectHaptic, successHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { useMission } from '@/store/mission';
import { colors, radius, shadows, tones } from '@/theme';

import { baseSupport, recordAppEvidence, seededShuffle, type StepProps } from './context';
import { Glow, HINT_A11Y, useHintVisible } from './Hints';

/** How long the "that's a kind choice" beat stays before moving on. */
const CONFIRM_MS = 1800;

function GentleFeedback({ option, onTryAgain }: { option: ChoiceOption | null; onTryAgain: () => void }) {
  return (
    <Sheet visible={!!option} onClose={onTryAgain}>
      {option && (
        <View style={{ alignItems: 'center' }}>
          <Fox pose="bust" size={140} expression="thinking" interactive={false} decorative />
          <Txt v="heading" center style={{ marginTop: 6 }} accessibilityRole="header">
            Let’s think about it together
          </Txt>
          <Txt v="bodyLg" center color={colors.textSoft} style={{ marginTop: 6, marginBottom: 18 }}>
            {option.feedback}
          </Txt>
          <Button title="Try another way" onPress={onTryAgain} style={{ alignSelf: 'stretch' }} />
        </View>
      )}
    </Sheet>
  );
}

/** Tracks misses and escalates support one step at a time (visual cue → model). */
function useAttempts(base: SupportLevel) {
  const [misses, setMisses] = useState<string[]>([]);
  const support = (misses.length === 0 ? base : misses.length === 1 ? Math.max(base, 3) : Math.max(base, 5)) as SupportLevel;
  return { misses, addMiss: (id: string) => setMisses((m) => (m.includes(id) ? m : [...m, id])), support };
}

/** While a choice step is focused, My Tools knows there are options on screen. */
function useHasOptions() {
  useFocusEffect(
    useCallback(() => {
      useMission.getState().setHasOptions(true);
      return () => useMission.getState().setHasOptions(false);
    }, []),
  );
}

/**
 * The confirmation beat after a helpful choice: the chosen card is marked,
 * praise is shown, then the mission moves on by itself — or waits for Next
 * when motion is off or the learner needs extra processing time.
 */
function useConfirm(learner: Learner, next: () => void) {
  const level = useMotionLevel();
  const auto = level !== 'off' && learner.access?.processing !== 'extended' && learner.access?.processing !== 'noTimer';
  const [chosen, setChosen] = useState<ChoiceOption | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);
  // Leaving the step (moving on, Back, My Tools) clears the beat so a return visit can answer again.
  useFocusEffect(
    useCallback(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        moved.current = false;
        setChosen(null);
      },
      [],
    ),
  );
  const go = useCallback(() => {
    if (moved.current) return;
    moved.current = true;
    if (timer.current) clearTimeout(timer.current);
    next();
  }, [next]);
  const confirm = (o: ChoiceOption) => {
    setChosen(o);
    announce(o.feedback);
    if (auto) timer.current = setTimeout(go, CONFIRM_MS);
  };
  return { chosen, confirm, go, auto };
}

function Praise({ option, auto, onNext }: { option: ChoiceOption; auto: boolean; onNext: () => void }) {
  return (
    <Appear from="zoom" style={{ gap: 10 }}>
      <View style={styles.praise} accessibilityLiveRegion="polite">
        <Fox pose="head" size={64} interactive={false} decorative />
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 19, lineHeight: 25 }}>
          {option.feedback}
        </Txt>
      </View>
      {auto ? null : <Button title="Next" onPress={onNext} />}
    </Appear>
  );
}

/** 07 · Choose Response */
export function StepQuickChoice({ mission, step, learner, next }: StepProps<Extract<MissionStep, { type: 'quickChoice' }>>) {
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  const hint = useHintVisible(base);
  const { misses, addMiss, support } = useAttempts(base);
  const [feedback, setFeedback] = useState<ChoiceOption | null>(null);
  const runId = useMission((s) => s.runId);
  const preferred = learner.access?.communication;
  const options = useMemo(() => seededShuffle(choicesForBand(step.options, learner.band, preferred), `${runId ?? ''}:${step.id}`), [step.options, step.id, learner.band, preferred, runId]);
  const short = learner.band === 'A';
  const labelOf = (o: ChoiceOption) => (short && o.short ? o.short : o.label);
  // When every option is a kind, valid choice there is nothing to cue.
  const allHelpful = options.every((o) => o.helpful);
  const { chosen, confirm, go, auto } = useConfirm(learner, next);
  const startStep = useMission((s) => s.startStep);
  useHasOptions();
  useEffect(() => {
    startStep();
    speak(step.title);
  }, [startStep, step.title]);

  const choose = (o: ChoiceOption) => {
    if (chosen) return;
    selectHaptic();
    if (o.helpful) {
      playSound('chime', 0.5);
      successHaptic();
      recordAppEvidence({ learner, mission, ev: step.evidence, stepId: step.id, success: true, support: Math.max(support, hint.visible ? hint.level : 1) as SupportLevel, modality: o.modality });
      speak(o.feedback);
      confirm(o);
    } else {
      addMiss(o.id);
      hint.reveal(misses.length >= 1 ? 5 : 3);
      speak(o.feedback);
      setFeedback(o);
    }
  };

  return (
    <Screen header={<Header title="" right={<MyToolsButton />} />} footer={chosen ? <Praise option={chosen} auto={auto} onNext={go} /> : undefined}>
      <View style={styles.titleRow}>
        <Txt v="title" center style={{ fontSize: 32, flexShrink: 1 }} accessibilityRole="header">
          {step.title}
        </Txt>
        <ReadAloudButton text={[step.title, ...options.map(labelOf)].join('. ')} />
      </View>
      <View style={{ gap: 14 }}>
        {options.map((o, i) => {
          const t = tones[o.tone];
          const dim = misses.includes(o.id) || (!!chosen && chosen.id !== o.id);
          const on = chosen?.id === o.id;
          const hinted = hint.visible && o.helpful && !allHelpful && !chosen;
          return (
            <Appear key={o.id} delay={i * 70}>
              <Glow on={hinted} radius={radius.xl}>
                <Tap
                  onPress={() => choose(o)}
                  onLongPress={() => speak(o.label, { force: true })}
                  accessibilityLabel={o.label}
                  accessibilityHint={hinted ? HINT_A11Y : undefined}
                  accessibilityState={{ selected: on }}
                  style={[styles.quick, { backgroundColor: t.bg, opacity: dim ? 0.5 : 1 }, on ? styles.chosen : null]}
                  scale={0.96}
                >
                  <Icon name={o.icon ?? 'star'} size={72} />
                  <Txt v="heading" color="#1B2C7E" style={{ flex: 1, marginLeft: 18, fontSize: 24, lineHeight: 31, fontFamily: 'Nunito_600SemiBold' }}>
                    {labelOf(o)}
                  </Txt>
                  {on ? <CheckBadge size={36} style={styles.badge} /> : null}
                </Tap>
              </Glow>
            </Appear>
          );
        })}
      </View>
      <GentleFeedback option={feedback} onTryAgain={() => setFeedback(null)} />
    </Screen>
  );
}

function OptionArt({ art }: { art?: ArtId }) {
  switch (art) {
    case 'fox':
      return <Fox pose="head" size={92} interactive={false} decorative />;
    case 'aiden':
      return (
        <IconTile tone="butter" size={84} radiusPx={22}>
          <AidenFace size={78} />
        </IconTile>
      );
    case 'device':
      return (
        <IconTile tone="sky" size={84} radiusPx={42}>
          <Icon name="phone" size={60} />
        </IconTile>
      );
    default:
      return <Icon name="star" size={60} />;
  }
}

/** 14 · Response Choice */
export function StepCardChoice({ mission, step, learner, next }: StepProps<Extract<MissionStep, { type: 'cardChoice' }>>) {
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  const hint = useHintVisible(base);
  const { misses, addMiss, support } = useAttempts(base);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ChoiceOption | null>(null);
  const preferred = learner.access?.communication;
  // Card order follows the authored story (reference board 14); the band still trims it.
  const options = useMemo(() => choicesForBand(step.options, learner.band, preferred), [step.options, learner.band, preferred]);
  const short = learner.band === 'A';
  const labelOf = (o: ChoiceOption) => (short && o.short ? o.short : o.label);
  const { chosen, confirm: confirmBeat, go, auto } = useConfirm(learner, next);
  const startStep = useMission((s) => s.startStep);
  useHasOptions();
  useEffect(() => {
    startStep();
    speak(`${step.title} ${step.subtitle}`);
  }, [startStep, step.title, step.subtitle]);

  const confirm = () => {
    if (chosen) return;
    const o = options.find((x) => x.id === picked);
    if (!o) return;
    if (o.helpful) {
      playSound('chime', 0.5);
      successHaptic();
      recordAppEvidence({ learner, mission, ev: step.evidence, stepId: step.id, success: true, support: Math.max(support, hint.visible ? hint.level : 1) as SupportLevel, modality: o.modality });
      speak(o.feedback);
      confirmBeat(o);
    } else {
      addMiss(o.id);
      hint.reveal(misses.length >= 1 ? 5 : 3);
      speak(o.feedback);
      setFeedback(o);
      setPicked(null);
    }
  };

  return (
    <Screen
      header={<Header title={step.title} subtitle={step.subtitle} right={<MyToolsButton />} />}
      footer={chosen ? <Praise option={chosen} auto={auto} onNext={go} /> : <Button title={step.cta} onPress={confirm} disabled={!picked} />}
    >
      <View style={styles.readRow}>
        <ReadAloudButton text={[`${step.title} ${step.subtitle}`, ...options.map(labelOf)].join('. ')} />
      </View>
      <View style={{ gap: 14, paddingTop: 4 }} accessibilityRole="radiogroup" accessibilityLabel={step.title}>
        {options.map((o, i) => {
          const on = picked === o.id;
          const dim = misses.includes(o.id) || (!!chosen && chosen.id !== o.id);
          const done = chosen?.id === o.id;
          const hinted = hint.visible && o.helpful && !on && !chosen;
          return (
            <Appear key={o.id} delay={i * 70}>
              <Glow on={hinted} radius={radius.xl}>
                <Tap
                  onPress={() => {
                    if (chosen) return;
                    selectHaptic();
                    setPicked(o.id);
                  }}
                  onLongPress={() => speak(o.label, { force: true })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={o.label}
                  accessibilityHint={hinted ? HINT_A11Y : undefined}
                  style={[styles.card, on ? styles.cardOn : null, done ? styles.chosen : null, { opacity: dim ? 0.5 : 1 }]}
                  scale={0.97}
                >
                  <View style={{ width: 96, alignItems: 'center' }}>
                    <OptionArt art={o.art} />
                  </View>
                  <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 21, lineHeight: 28, marginLeft: 8 }}>
                    {labelOf(o)}
                  </Txt>
                  {on ? <CheckBadge size={done ? 36 : 38} style={{ position: 'absolute', top: -12, right: -8 }} /> : null}
                </Tap>
              </Glow>
            </Appear>
          );
        })}
        <Appear delay={options.length * 70}>
          <Tap
            onPress={() => {
              // A thinking tip: shows a visual cue without counting as a Help request.
              hint.reveal(3);
              speak(step.tip.text, { force: true });
            }}
            accessibilityLabel={`${step.tip.text} Tap for a hint.`}
            style={[styles.card, { backgroundColor: colors.mintTint }]}
            scale={0.97}
          >
            <View style={{ width: 96, alignItems: 'center' }}>
              <Icon name="sprout" size={78} />
            </View>
            <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 20, lineHeight: 27, marginLeft: 8 }}>
              {step.tip.text.replace('. ', '.\n')}
            </Txt>
          </Tap>
        </Appear>
      </View>
      <GentleFeedback option={feedback} onTryAgain={() => setFeedback(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  readRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4, marginBottom: 8 },
  quick: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, paddingVertical: 20, paddingHorizontal: 18, minHeight: 112, borderWidth: 3, borderColor: 'transparent' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radius.xl, paddingVertical: 16, paddingHorizontal: 12, minHeight: 116, borderWidth: 2.5, borderColor: 'transparent' },
  cardOn: { borderColor: colors.primary },
  chosen: { borderWidth: 3, borderColor: colors.mint },
  badge: { position: 'absolute', top: -12, right: -8 },
  praise: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.mintTint, borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 14, ...shadows.soft },
});

import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { AidenFace } from '@/components/characters/People';
import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Appear, Button, CheckBadge, Header, IconTile, Screen, Sheet, Tap, Txt } from '@/components/ui';
import type { ArtId, ChoiceOption, MissionStep } from '@/content/types';
import { choicesForBand } from '@/engine/bands';
import type { SupportLevel } from '@/engine/types';
import { selectHaptic, successHaptic } from '@/lib/feedback';
import { playSound } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { useMission } from '@/store/mission';
import { colors, radius, tones } from '@/theme';

import { baseSupport, recordAppEvidence, type StepProps } from './context';
import { Glow, useHintVisible } from './Hints';

function GentleFeedback({ option, onTryAgain }: { option: ChoiceOption | null; onTryAgain: () => void }) {
  return (
    <Sheet visible={!!option} onClose={onTryAgain}>
      {option && (
        <View style={{ alignItems: 'center' }}>
          <Fox pose="bust" size={140} expression="smile" interactive={false} />
          <Txt v="heading" center style={{ marginTop: 6 }}>
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

/** 07 · Choose Response */
export function StepQuickChoice({ mission, step, learner, next }: StepProps<Extract<MissionStep, { type: 'quickChoice' }>>) {
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  const hint = useHintVisible(base);
  const { misses, addMiss, support } = useAttempts(base);
  const [feedback, setFeedback] = useState<ChoiceOption | null>(null);
  const options = useMemo(() => choicesForBand(step.options, learner.band), [step.options, learner.band]);
  // When every option is a kind, valid choice there is nothing to cue.
  const allHelpful = options.every((o) => o.helpful);
  const startStep = useMission((s) => s.startStep);
  useEffect(() => {
    startStep();
    speak(step.title);
  }, [startStep, step.title]);

  const choose = (o: ChoiceOption) => {
    selectHaptic();
    if (o.helpful) {
      playSound('chime', 0.5);
      successHaptic();
      recordAppEvidence({ learner, mission, ev: step.evidence, success: true, support: Math.max(support, hint.visible ? hint.level : 1) as SupportLevel, modality: o.modality });
      speak(o.feedback);
      next();
    } else {
      addMiss(o.id);
      hint.reveal(misses.length >= 1 ? 5 : 3);
      speak(o.feedback);
      setFeedback(o);
    }
  };

  return (
    <Screen header={<Header title="" right={<MyToolsButton />} />}>
      <Txt v="title" center style={{ fontSize: 32, marginBottom: 20 }} accessibilityRole="header">
        {step.title}
      </Txt>
      <View style={{ gap: 14 }}>
        {options.map((o, i) => {
          const t = tones[o.tone];
          const dim = misses.includes(o.id);
          return (
            <Appear key={o.id} delay={i * 70}>
              <Glow on={hint.visible && o.helpful && !allHelpful} radius={radius.xl}>
                <Tap onPress={() => choose(o)} accessibilityLabel={o.label} style={[styles.quick, { backgroundColor: t.bg, opacity: dim ? 0.55 : 1 }]} scale={0.96}>
                  <Icon name={o.icon ?? 'star'} size={72} />
                  <Txt v="heading" color="#1B2C7E" style={{ flex: 1, marginLeft: 18, fontSize: 24, lineHeight: 31, fontFamily: 'Nunito_600SemiBold' }}>
                    {o.label}
                  </Txt>
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
      return <Fox pose="head" size={92} interactive={false} />;
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
  const startStep = useMission((s) => s.startStep);
  useEffect(() => {
    startStep();
    speak(`${step.title} ${step.subtitle}`);
  }, [startStep, step.title, step.subtitle]);

  const confirm = () => {
    const o = step.options.find((x) => x.id === picked);
    if (!o) return;
    if (o.helpful) {
      playSound('chime', 0.5);
      successHaptic();
      recordAppEvidence({ learner, mission, ev: step.evidence, success: true, support: Math.max(support, hint.visible ? hint.level : 1) as SupportLevel, modality: o.modality });
      next();
    } else {
      addMiss(o.id);
      hint.reveal(misses.length >= 1 ? 5 : 3);
      speak(o.feedback);
      setFeedback(o);
      setPicked(null);
    }
  };

  return (
    <Screen header={<Header title={step.title} subtitle={step.subtitle} right={<MyToolsButton />} />} footer={<Button title={step.cta} onPress={confirm} disabled={!picked} />}>
      <View style={{ gap: 14, paddingTop: 12 }}>
        {step.options.map((o, i) => {
          const on = picked === o.id;
          const dim = misses.includes(o.id);
          return (
            <Appear key={o.id} delay={i * 70}>
              <Glow on={hint.visible && o.helpful && !on} radius={radius.xl}>
                <Tap
                  onPress={() => {
                    selectHaptic();
                    setPicked(o.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={o.label}
                  style={[styles.card, on ? styles.cardOn : null, { opacity: dim ? 0.55 : 1 }]}
                  scale={0.97}
                >
                  <View style={{ width: 96, alignItems: 'center' }}>
                    <OptionArt art={o.art} />
                  </View>
                  <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 21, lineHeight: 28, marginLeft: 8 }}>
                    {o.label}
                  </Txt>
                  {on ? <CheckBadge size={38} style={{ position: 'absolute', top: -12, right: -8 }} /> : null}
                </Tap>
              </Glow>
            </Appear>
          );
        })}
        <Appear delay={step.options.length * 70}>
          <Tap
            onPress={() => {
              useMission.getState().requestHelp();
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
  quick: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, paddingVertical: 20, paddingHorizontal: 18, minHeight: 112 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radius.xl, paddingVertical: 16, paddingHorizontal: 12, minHeight: 116, borderWidth: 2.5, borderColor: 'transparent' },
  cardOn: { borderColor: colors.primary },
});

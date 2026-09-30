import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { buddyName } from '@/components/kid/Buddy';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, CheckBadge, FitBox, Header, Tap, Txt } from '@/components/ui';
import type { MissionStep } from '@/content/types';
import type { Modality, SupportLevel } from '@/engine/types';
import { announce } from '@/lib/announce';
import { selectHaptic, successHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { speak, stopSpeaking } from '@/lib/speech';
import { useMission } from '@/store/mission';
import { colors, GUTTER, radius, shadows } from '@/theme';

import { baseSupport, recordAppEvidence, seededShuffle, type StepProps } from './context';
import { Glow } from './Hints';

type PracticeStep = Extract<MissionStep, { type: 'practice' }>;

const PHASES = [
  { key: 'in', seconds: 3, to: 1 },
  { key: 'hold', seconds: 2, to: 1 },
  { key: 'out', seconds: 3, to: 0 },
] as const;

function Shell({
  step,
  learnerBuddy,
  children,
  footer,
  fox,
  foxMax,
}: {
  step: PracticeStep;
  learnerBuddy: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Renders the hero at the largest size (≤ foxMax) that fits the screen. */
  fox: (size: number) => React.ReactNode;
  foxMax: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape
        style={StyleSheet.absoluteFill}
        spec={{
          horizon: 0.36,
          ground: 0.46,
          clouds: [
            { x: 0.12, y: 0.16, s: 0.6 },
            { x: 0.88, y: 0.18, s: 0.7 },
            { x: 0.76, y: 0.26, s: 0.45 },
          ],
          trees: [
            { x: 0.12, base: 0.48, h: 150 },
            { x: 0.78, base: 0.46, h: 110 },
            { x: 0.9, base: 0.49, h: 90, tone: 'light' },
          ],
          bushes: [
            { x: 0.08, base: 0.55, s: 1.4, tone: 'deep' },
            { x: 0.92, base: 0.56, s: 1.3, tone: 'deep' },
          ],
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <Header title={step.title} subtitle={step.subtitle.replace('{buddy}', learnerBuddy)} right={<MyToolsButton />} />
      </View>
      <FitBox style={styles.hero} max={foxMax} min={96}>
        {fox}
      </FitBox>
      <Appear style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <Txt v="title" style={{ fontSize: 28, marginBottom: 10 }}>
          {step.heading}
        </Txt>
        {children}
        <View style={{ marginTop: 14 }}>{footer}</View>
      </Appear>
    </View>
  );
}

function NumberDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <View style={[styles.dot, active ? { backgroundColor: colors.primary } : null]}>
      {done ? <Icon name="check" size={26} color="#FFFFFF" /> : <Txt v="heading" color="#FFFFFF" style={{ fontSize: 24 }}>{String(n)}</Txt>}
    </View>
  );
}

const PHASE_WORDS = { in: 'Breathe in', hold: 'Hold', out: 'Breathe out' } as const;

/** 15 · Supported Try — guided deep breathing with the guide fox (breathes in sync). Modelled, so not graded. */
function Breathing({ mission, step, learner, next }: StepProps<PracticeStep>) {
  const level = useMotionLevel();
  const breath = useSharedValue(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(-1);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [finished, setFinished] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.18 + breath.value * 0.35, transform: [{ scale: 0.7 + breath.value * 0.45 }] }));
  const pace = learner.access?.processing === 'extended' ? 1.5 : 1;

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimation(breath);
    breath.set(0);
    setRunning(false);
    setPhase(-1);
    setCount(0);
  }, [breath]);

  // Leaving the screen (My Tools → Break, Back) stops the guide and its voice.
  useFocusEffect(
    useCallback(
      () => () => {
        stop();
        stopSpeaking();
      },
      [stop],
    ),
  );

  const run = () => {
    stop();
    setRunning(true);
    setFinished(false);
    setCycles(0);
    let t = 0;
    const TOTAL = 2;
    for (let c = 0; c < TOTAL; c++) {
      PHASES.forEach((ph, pi) => {
        const ms = ph.seconds * pace * 1000;
        timers.current.push(
          setTimeout(() => {
            setPhase(pi);
            setCycles(c);
            speak(PHASE_WORDS[ph.key], { force: false });
            announce(PHASE_WORDS[ph.key]);
            cancelAnimation(breath);
            breath.value = level === 'off' ? ph.to : withTiming(ph.to, { duration: ms, easing: Easing.inOut(Easing.sin) });
          }, t),
        );
        for (let k = 0; k < ph.seconds; k++) timers.current.push(setTimeout(() => setCount(k + 1), t + k * pace * 1000));
        t += ms;
      });
    }
    timers.current.push(
      setTimeout(() => {
        timers.current = [];
        setRunning(false);
        setPhase(-1);
        setFinished(true);
        playSound('chime', 0.45);
        successHaptic();
        speak('Nice breathing! You did it together.');
        // Breathing along with a model is participation, not a graded opportunity.
        recordAppEvidence({ learner, mission, ev: step.evidence, stepId: step.id, success: true, support: 5, quality: 'invalid', extraTags: ['participation'], note: 'Guided deep breathing with a model (Try Together).' });
      }, t + 200),
    );
  };

  const current = running && phase >= 0 ? PHASES[phase].key : undefined;
  return (
    <Shell
      step={step}
      learnerBuddy={buddyName(learner.buddy)}
      foxMax={282}
      fox={(size) => (
        <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <Animated.View pointerEvents="none" style={[styles.ring, ring, { width: size * 0.82, height: size * 0.82, borderRadius: size * 0.41, bottom: size * 0.14 }]} />
          <Fox pose="breathe" size={size} breath={running ? breath : undefined} breathPhase={current} />
        </View>
      )}
      footer={
        finished ? (
          <Button title="Next" onPress={next} />
        ) : (
          <View style={{ gap: 8 }}>
            {running ? (
              <Button title={`Pause · ${PHASE_WORDS[current ?? 'in']} ${count}`} kind="soft" onPress={stop} />
            ) : (
              <Button title={step.cta} onPress={run} />
            )}
            <Button title="Skip for now" kind="ghost" size="md" onPress={next} />
          </View>
        )
      }
    >
      <View style={{ gap: 6 }}>
        {step.steps.map((s, i) => {
          const active = running && phase === i;
          const done = finished || (running && (phase > i || cycles > 0));
          return (
            <View key={s} style={[styles.stepRow, active ? { backgroundColor: colors.primarySoft } : null]}>
              <NumberDot n={i + 1} active={active} done={done && !active} />
              <Txt v="bodyLg" color={colors.text} style={{ fontSize: 20, flex: 1 }}>
                {s}
              </Txt>
            </View>
          );
        })}
      </View>
    </Shell>
  );
}

/** Help Hero practice — ask for help your way (Help card, words, a point or sign) and a helper comes. */
function HelpSignal({ mission, step, learner, next }: StepProps<PracticeStep>) {
  const [stage, setStage] = useState(0);
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    useMission.getState().startStep();
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        stopSpeaking();
        // Coming back after leaving mid-way shows the finished state (the ask was already recorded).
        setStage((st) => (st > 0 ? 3 : st));
      },
      [],
    ),
  );
  const press = (modality: Modality) => {
    if (stage > 0) return;
    selectHaptic();
    playSound('sparkle', 0.5);
    setStage(1);
    // Asking for help is the skill being practised, so it is recorded at once and never counted as a Help request.
    recordAppEvidence({ learner, mission, ev: step.evidence, stepId: step.id, success: true, support: base as SupportLevel, modality });
    speak(modality === 'aac' ? 'Help, please! I’m here to help you!' : 'I’m here to help you!', { force: false });
    timer.current = setTimeout(() => {
      timer.current = null;
      setStage(3);
      successHaptic();
    }, 1400);
  };
  return (
    <Shell step={step} learnerBuddy={buddyName(learner.buddy)} foxMax={250} fox={(size) => <Fox pose={stage === 3 ? 'cheer' : 'wave'} size={size} />} footer={stage === 3 ? <Button title="Next" onPress={next} /> : null}>
      <View style={{ gap: 10 }}>
        {step.steps.map((s, i) => (
          <View key={s} style={[styles.stepRow, stage >= i + 1 ? { backgroundColor: colors.mintTint } : null]}>
            <NumberDot n={i + 1} active={stage === i} done={stage > i} />
            <Txt v="bodyLg" color={colors.text} style={{ fontSize: 19, flex: 1 }}>
              {s}
            </Txt>
          </View>
        ))}
      </View>
      {stage < 3 && (
        <>
          <Glow on={stage === 0 && base >= 3}>
            <Tap onPress={() => press('aac')} style={styles.helpBtn} accessibilityLabel="Help, please" scale={0.94} disabled={stage > 0}>
              <Icon name="hand" size={48} />
              <Txt v="title" color="#FFFFFF" style={{ fontSize: 28 }}>
                Help, please!
              </Txt>
            </Tap>
          </Glow>
          <View style={styles.altRow}>
            <Button title="I said it" kind="soft" size="md" onPress={() => press('speech')} disabled={stage > 0} style={{ flex: 1 }} />
            <Button title="I pointed or signed" kind="soft" size="md" onPress={() => press('gesture')} disabled={stage > 0} style={{ flex: 1.4 }} />
          </View>
        </>
      )}
    </Shell>
  );
}

/** Routine Road practice — tap steps in the order that works for you (any complete order is fine). */
function Sequence({ mission, step, learner, next }: StepProps<PracticeStep>) {
  const runId = useMission((s) => s.runId);
  const shuffled = useMemo(() => seededShuffle(step.steps, `${runId ?? ''}:${step.id}`), [step.steps, step.id, runId]);
  const [placed, setPlaced] = useState<string[]>([]);
  const orders = step.orders ?? [step.steps];
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  // At model-level support, glow a suggested next card (only a suggestion: every card can be tapped).
  const suggested = new Set(orders.filter((o) => placed.every((p, i) => o[i] === p)).map((o) => o[placed.length]));
  useEffect(() => {
    useMission.getState().startStep();
  }, []);
  const tap = (s: string) => {
    if (placed.includes(s)) return;
    selectHaptic();
    playSound('tap', 0.4);
    const nextPlaced = [...placed, s];
    setPlaced(nextPlaced);
    if (nextPlaced.length === step.steps.length) {
      successHaptic();
      playSound('chime', 0.45);
      const usual = orders.some((o) => o.every((x, i) => x === nextPlaced[i]));
      recordAppEvidence({ learner, mission, ev: step.evidence, stepId: step.id, success: true, support: base as SupportLevel, note: `Order chosen: ${nextPlaced.join(' → ')}${usual ? '' : ' (their own order)'}` });
    }
  };
  const undo = () => setPlaced((p) => (p.length === step.steps.length ? p : p.slice(0, -1)));
  const complete = placed.length === step.steps.length;
  return (
    <Shell step={step} learnerBuddy={buddyName(learner.buddy)} foxMax={220} fox={(size) => <Fox pose={complete ? 'cheer' : 'wave'} size={size} />} footer={complete ? <Button title="Next" onPress={next} /> : null}>
      <Txt v="body" color={colors.textSoft} style={{ marginBottom: 10 }}>
        {step.subtitle}
      </Txt>
      <View style={styles.slots}>
        {step.steps.map((_, i) => (
          <View key={i} style={styles.slot}>
            <Txt v="label" color={placed[i] ? colors.ink : colors.textFaint} center>
              {placed[i] ?? String(i + 1)}
            </Txt>
          </View>
        ))}
      </View>
      <View style={styles.pool}>
        {shuffled.map((s) => {
          const used = placed.includes(s);
          return (
            <Glow key={s} on={!used && base >= 5 && suggested.has(s)} radius={16}>
              <Tap onPress={() => tap(s)} disabled={used} style={[styles.chipCard, used ? { opacity: 0.35 } : null]} accessibilityLabel={s} scale={0.94}>
                <Txt v="label" color={colors.ink}>
                  {s}
                </Txt>
                {used ? <CheckBadge size={22} style={{ position: 'absolute', right: -6, top: -6 }} /> : null}
              </Tap>
            </Glow>
          );
        })}
      </View>
      {placed.length > 0 && !complete ? <Button title="Undo last" kind="ghost" size="sm" onPress={undo} style={{ alignSelf: 'center', marginTop: 8 }} /> : null}
    </Shell>
  );
}

export function StepPractice(props: StepProps<PracticeStep>) {
  if (props.step.kind === 'helpSignal') return <HelpSignal {...props} />;
  if (props.step.kind === 'sequence') return <Sequence {...props} />;
  return <Breathing {...props} />;
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: GUTTER,
    paddingTop: 20,
    ...shadows.card,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, paddingVertical: 4, paddingHorizontal: 4 },
  dot: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', bottom: 40, width: 230, height: 230, borderRadius: 115, backgroundColor: '#8FD3B8' },
  altRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  helpBtn: { marginTop: 14, height: 76, borderRadius: 38, backgroundColor: '#F28A5B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, ...shadows.button },
  slots: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  slot: { flex: 1, minHeight: 54, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C9D6EE', alignItems: 'center', justifyContent: 'center', padding: 4 },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipCard: { backgroundColor: colors.butterSoft, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
});

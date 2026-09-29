import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { buddyName } from '@/components/kid/Buddy';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, CheckBadge, Header, Tap, Txt } from '@/components/ui';
import type { MissionStep } from '@/content/types';
import type { SupportLevel } from '@/engine/types';
import { selectHaptic, successHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { useMission } from '@/store/mission';
import { colors, GUTTER, radius, shadows } from '@/theme';

import { baseSupport, recordAppEvidence, type StepProps } from './context';
import { Glow } from './Hints';

type PracticeStep = Extract<MissionStep, { type: 'practice' }>;

const PHASES = [
  { key: 'in', seconds: 3, to: 1 },
  { key: 'hold', seconds: 2, to: 1 },
  { key: 'out', seconds: 3, to: 0 },
] as const;

function Shell({ step, learnerBuddy, children, footer, fox }: { step: PracticeStep; learnerBuddy: string; children: React.ReactNode; footer: React.ReactNode; fox: React.ReactNode }) {
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
      <View style={styles.hero}>{fox}</View>
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

/** 15 · Supported Try — guided deep breathing with Finn (fox breathes in sync). */
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

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    setRunning(true);
    setFinished(false);
    setCycles(0);
    let t = 0;
    const TOTAL = 2;
    for (let c = 0; c < TOTAL; c++) {
      PHASES.forEach((ph, pi) => {
        timers.current.push(
          setTimeout(() => {
            setPhase(pi);
            setCycles(c);
            speak(ph.key === 'in' ? 'Breathe in' : ph.key === 'hold' ? 'Hold' : 'Breathe out', { force: false });
            cancelAnimation(breath);
            breath.value = level === 'off' ? ph.to : withTiming(ph.to, { duration: ph.seconds * 1000, easing: Easing.inOut(Easing.sin) });
          }, t),
        );
        for (let k = 0; k < ph.seconds; k++) timers.current.push(setTimeout(() => setCount(k + 1), t + k * 1000));
        t += ph.seconds * 1000;
      });
    }
    timers.current.push(
      setTimeout(() => {
        setRunning(false);
        setPhase(-1);
        setFinished(true);
        playSound('chime', 0.45);
        successHaptic();
        speak('Nice breathing! You did it together.');
        recordAppEvidence({ learner, mission, ev: step.evidence, success: true, support: 5, note: 'Guided deep breathing with a model (Try Together).' });
      }, t + 200),
    );
  };

  return (
    <Shell
      step={step}
      learnerBuddy={buddyName(learner.buddy)}
      fox={
        <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <Animated.View pointerEvents="none" style={[styles.ring, ring]} />
          <Fox pose="breathe" size={250} breath={running ? breath : undefined} />
        </View>
      }
      footer={
        finished ? (
          <Button title="Next" onPress={next} />
        ) : (
          <Button title={running ? `${['Breathe in', 'Hold', 'Breathe out'][Math.max(0, phase)]}… ${count}` : step.cta} onPress={running ? undefined : run} />
        )
      }
    >
      <View style={{ gap: 10 }}>
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

/** Help Hero practice — tap the Help signal (AAC-style) and a helper comes. */
function HelpSignal({ mission, step, learner, next }: StepProps<PracticeStep>) {
  const [stage, setStage] = useState(0);
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  useEffect(() => {
    useMission.getState().startStep();
  }, []);
  const press = () => {
    if (stage > 0) return;
    selectHaptic();
    playSound('sparkle', 0.5);
    setStage(1);
    speak('Help, please! I’m here to help you!', { force: false });
    setTimeout(() => {
      setStage(3);
      successHaptic();
      recordAppEvidence({ learner, mission, ev: step.evidence, success: true, support: base as SupportLevel, modality: 'aac', extraTools: ['help'] });
    }, 1400);
  };
  return (
    <Shell step={step} learnerBuddy={buddyName(learner.buddy)} fox={<Fox pose={stage === 3 ? 'cheer' : 'wave'} size={250} />} footer={stage === 3 ? <Button title="Next" onPress={next} /> : null}>
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
        <Glow on={stage === 0 && base >= 3}>
          <Tap onPress={press} style={styles.helpBtn} accessibilityLabel="Help, please" scale={0.94}>
            <Icon name="hand" size={48} />
            <Txt v="title" color="#FFFFFF" style={{ fontSize: 28 }}>
              Help, please!
            </Txt>
          </Tap>
        </Glow>
      )}
    </Shell>
  );
}

/** Routine Road practice — tap steps in the order you like (more than one order is fine). */
function Sequence({ mission, step, learner, next }: StepProps<PracticeStep>) {
  const shuffled = useMemo(() => [step.steps[2], step.steps[0], step.steps[3], step.steps[1]].filter(Boolean), [step.steps]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const orders = step.orders ?? [step.steps];
  const base = useMemo(() => baseSupport(learner.id, step.evidence, learner.band), [learner.id, learner.band, step.evidence]);
  const nextOptions = new Set(orders.filter((o) => placed.every((p, i) => o[i] === p)).map((o) => o[placed.length]));
  useEffect(() => {
    useMission.getState().startStep();
  }, []);
  const tap = (s: string) => {
    if (placed.includes(s)) return;
    if (nextOptions.has(s)) {
      selectHaptic();
      playSound('tap', 0.4);
      const nextPlaced = [...placed, s];
      setPlaced(nextPlaced);
      setNudge(null);
      if (nextPlaced.length === step.steps.length) {
        successHaptic();
        playSound('chime', 0.45);
        recordAppEvidence({ learner, mission, ev: step.evidence, success: true, support: (misses ? Math.max(base, 3) : base) as SupportLevel });
      }
    } else {
      setMisses((m) => m + 1);
      setNudge('Hmm, what comes next in your morning? Look for the glowing card.');
    }
  };
  const complete = placed.length === step.steps.length;
  return (
    <Shell step={step} learnerBuddy={buddyName(learner.buddy)} fox={<Fox pose={complete ? 'cheer' : 'wave'} size={220} />} footer={complete ? <Button title="Next" onPress={next} /> : null}>
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
            <Glow key={s} on={!used && (misses > 0 || base >= 5) && nextOptions.has(s)} radius={16}>
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
      {nudge ? (
        <Txt v="body" color={colors.textSoft} center style={{ marginTop: 8 }}>
          {nudge}
        </Txt>
      ) : null}
    </Shell>
  );
}

export function StepPractice(props: StepProps<PracticeStep>) {
  if (props.step.kind === 'helpSignal') return <HelpSignal {...props} />;
  if (props.step.kind === 'sequence') return <Sequence {...props} />;
  return <Breathing {...props} />;
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 180 },
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
  dot: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', bottom: 40, width: 230, height: 230, borderRadius: 115, backgroundColor: '#8FD3B8' },
  helpBtn: { marginTop: 14, height: 76, borderRadius: 38, backgroundColor: '#F28A5B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, ...shadows.button },
  slots: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  slot: { flex: 1, minHeight: 54, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C9D6EE', alignItems: 'center', justifyContent: 'center', padding: 4 },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipCard: { backgroundColor: colors.butterSoft, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
});

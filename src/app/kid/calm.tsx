import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Landscape } from '@/components/scenery/Landscape';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Appear, Button, FitBox, Header, Sheet, Tap, Txt } from '@/components/ui';
import { selectHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { AMBIENT, playSound } from '@/lib/sound';
import { GUIDE } from '@/content/cast';
import { announce } from '@/lib/announce';
import { speak, stopSpeaking } from '@/lib/speech';
import { colors, GUTTER, radius, shadows, tones } from '@/theme';

type Module = 'breathe' | 'sounds' | 'feelings' | 'focus' | null;

const MODULES: { key: Exclude<Module, null>; label: string; icon: IconName }[] = [
  { key: 'breathe', label: 'Breathe', icon: 'sprout' },
  { key: 'sounds', label: 'Quiet Sounds', icon: 'moon' },
  { key: 'feelings', label: 'My Feelings', icon: 'heart' },
  { key: 'focus', label: 'Gentle Focus', icon: 'sun' },
];

/* ---------------------------------------------------------------- Breathe */

type BreathPhase = 'in' | 'out';
const PHASE_MS = 4000;
const PHASE_LABEL: Record<BreathPhase, string> = { in: 'Breathe in…', out: 'Breathe out…' };

function BreatheModule({ breath, onPhase }: { breath: SharedValue<number>; onPhase: (p: BreathPhase | undefined) => void }) {
  const level = useMotionLevel();
  const [phase, setPhase] = useState<BreathPhase>('in');
  const [count, setCount] = useState(1);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) {
      onPhase(undefined);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    const run = (p: BreathPhase) => {
      setPhase(p);
      setCount(1);
      onPhase(p);
      speak(p === 'in' ? 'Breathe in' : 'Breathe out');
      announce(PHASE_LABEL[p]);
      const to = p === 'in' ? 1 : 0;
      breath.value = level === 'off' ? to : withTiming(to, { duration: PHASE_MS, easing: Easing.inOut(Easing.sin) });
      for (let i = 2; i <= 4; i++) later(() => setCount(i), ((i - 1) * PHASE_MS) / 4);
      later(() => run(p === 'in' ? 'out' : 'in'), PHASE_MS);
    };
    run('in');
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimation(breath);
      stopSpeaking();
      onPhase(undefined);
    };
  }, [breath, level, paused, onPhase]);
  // Opacity stays fixed so the circle never fades behind the words.
  const bubble = useAnimatedStyle(() => ({ transform: [{ scale: 0.6 + breath.value * 0.4 }] }));
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.guideRing} />
        <Animated.View style={[styles.bubble, bubble]} />
        {paused ? null : (
          <Txt v="number" color="#FFFFFF" style={{ fontSize: 40 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {String(count)}
          </Txt>
        )}
      </View>
      <Txt v="title" center color={colors.ink} style={{ fontSize: 26, marginTop: 14 }} accessibilityLiveRegion="polite">
        {paused ? 'Paused' : PHASE_LABEL[phase]}
      </Txt>
      <Txt v="body" center color={colors.textSoft} style={{ marginTop: 6 }}>
        {`Follow the circle with ${GUIDE.name}. Stop any time.`}
      </Txt>
      <Button kind="soft" size="md" title={paused ? 'Keep breathing' : 'Pause'} onPress={() => setPaused(!paused)} style={{ marginTop: 14, alignSelf: 'stretch' }} />
    </View>
  );
}

/* ----------------------------------------------------------- Quiet Sounds */

type SoundId = keyof typeof AMBIENT;
const SOUND_IDS = Object.keys(AMBIENT) as SoundId[];

/** Ambient loops play quietly and keep going until the child stops them. */
function loopSoftly(player: AudioPlayer) {
  player.loop = true;
  player.volume = 0.7;
}

function SoundRow({ id, player }: { id: SoundId; player: AudioPlayer }) {
  const on = useAudioPlayerStatus(player).playing;
  const toggle = () => {
    selectHaptic();
    if (on) player.pause();
    else player.play();
  };
  return (
    <Tap onPress={toggle} style={[styles.soundRow, on ? { backgroundColor: colors.skySoft } : null]} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={AMBIENT[id].label}>
      <View style={[styles.playBtn, { backgroundColor: on ? colors.primary : colors.sky }]}>
        <Icon name={on ? 'pause' : 'play'} size={22} />
      </View>
      <Txt v="subheading" color={colors.ink} style={{ flex: 1 }}>
        {AMBIENT[id].label}
      </Txt>
      <Txt v="caption" color={colors.textMuted}>
        {on ? 'Playing' : 'Tap to play'}
      </Txt>
    </Tap>
  );
}

/** Small "Now playing" chip on the Calm Space screen while a sound runs after its sheet closes. */
function NowPlaying({ players, onPress }: { players: Record<SoundId, AudioPlayer>; onPress: () => void }) {
  const rain = useAudioPlayerStatus(players.rain).playing;
  const waves = useAudioPlayerStatus(players.waves).playing;
  const forest = useAudioPlayerStatus(players.forest).playing;
  const playing = SOUND_IDS.filter((k) => ({ rain, waves, forest })[k]);
  if (!playing.length) return null;
  const label = `Now playing: ${playing.map((k) => AMBIENT[k].label).join(', ')}`;
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Tap onPress={onPress} style={styles.nowPlaying} accessibilityLabel={`${label}. Open Quiet Sounds`} scale={0.96}>
        <Icon name="moon" size={22} />
        <Txt v="label" color={colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Txt>
      </Tap>
    </View>
  );
}

/* ------------------------------------------------------------- My Message */

const MESSAGES: { text: string; icon: IconName; tone: keyof typeof tones }[] = [
  { text: 'I need help', icon: 'hand', tone: 'orange' },
  { text: 'I need space', icon: 'clock', tone: 'lavender' },
  { text: 'I’m not ready', icon: 'moon', tone: 'sky' },
  { text: 'Too much', icon: 'bell', tone: 'blush' },
  { text: 'No thank you', icon: 'close', tone: 'butter' },
  { text: 'More time', icon: 'clockOutline', tone: 'mint' },
];

function FeelingsModule() {
  const [shown, setShown] = useState<string | null>(null);
  if (shown) {
    return (
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View style={styles.bigMessage}>
          <Txt v="display" center color={colors.ink} style={{ fontSize: 40, lineHeight: 48 }}>
            {shown}
          </Txt>
        </View>
        <Txt v="body" center color={colors.textSoft}>
          Show this to a grown-up.
        </Txt>
        <Button kind="soft" title="Choose another" onPress={() => setShown(null)} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }
  return (
    <View>
      <Txt v="body" color={colors.textSoft} style={{ marginBottom: 12 }}>
        Tap a card to show or say your message.
      </Txt>
      <View style={styles.msgGrid}>
        {MESSAGES.map((m) => (
          <Tap
            key={m.text}
            onPress={() => {
              selectHaptic();
              speak(m.text, { force: true });
              setShown(m.text);
            }}
            style={[styles.msg, { backgroundColor: tones[m.tone].bg }]}
            accessibilityLabel={m.text}
          >
            <Icon name={m.icon} size={40} />
            <Txt v="subheading" center color={colors.ink} style={{ marginTop: 6, fontSize: 17 }}>
              {m.text}
            </Txt>
          </Tap>
        ))}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------- Gentle Focus */

/** Firefly spots as % of the sky panel, spread so no two overlap on any phone. */
const FIREFLY_SPOTS: [number, number][] = [
  [8, 12],
  [30, 58],
  [52, 20],
  [70, 64],
  [86, 30],
  [20, 82],
  [62, 86],
];
const FIREFLY = 26;

function Firefly({ x, y, delay, onCatch }: { x: number; y: number; delay: number; onCatch: () => void }) {
  const level = useMotionLevel();
  const t = useSharedValue(0);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (level === 'off') {
      t.value = 0;
      return;
    }
    t.value = withRepeat(withSequence(withTiming(1, { duration: 2600 + delay, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2600 + delay, easing: Easing.inOut(Easing.sin) })), -1, false);
    return () => cancelAnimation(t);
  }, [level, delay, t]);
  useEffect(() => {
    if (!hidden) return;
    const id = setTimeout(() => setHidden(false), 2200);
    return () => clearTimeout(id);
  }, [hidden]);
  const style = useAnimatedStyle(() => ({ opacity: 0.6 + t.value * 0.4, transform: [{ translateY: -t.value * 18 }, { translateX: Math.sin(t.value * Math.PI) * 10 }, { scale: 0.9 + t.value * 0.2 }] }));
  if (hidden) return null;
  return (
    <Animated.View style={[{ position: 'absolute', left: x - FIREFLY / 2, top: y - FIREFLY / 2 }, style]}>
      <Tap
        onPress={() => {
          playSound('sparkle', 0.3);
          setHidden(true);
          onCatch();
        }}
        accessibilityLabel="Glowing light"
        hitSlop={10}
      >
        <View style={styles.firefly} />
      </Tap>
    </Animated.View>
  );
}

function FocusModule() {
  const [caught, setCaught] = useState(0);
  const [sky, setSky] = useState<{ w: number; h: number } | null>(null);
  return (
    <View>
      <Txt v="body" color={colors.textSoft}>
        Watch the gentle lights float. Tap one if you like — there’s no rush and no score.
      </Txt>
      <View style={styles.sky} onLayout={(e) => setSky({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {sky
          ? FIREFLY_SPOTS.map(([px, py], i) => <Firefly key={i} x={(px / 100) * sky.w} y={Math.max((py / 100) * sky.h, FIREFLY)} delay={i * 350} onCatch={() => setCaught((c) => c + 1)} />)
          : null}
      </View>
      <Txt v="caption" center color={colors.textMuted}>
        {caught ? `You noticed ${caught} light${caught === 1 ? '' : 's'}.` : 'Breathe slowly while you watch.'}
      </Txt>
    </View>
  );
}

/** 10 · Calm Space — always available, never a consequence (Framework §49). */
export default function CalmSpace() {
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const focused = useIsFocused();
  const [open, setOpen] = useState<Module>(null);
  const [phase, setPhase] = useState<BreathPhase | undefined>(undefined);
  const breath = useSharedValue(0);
  // Players live here, not in the sheet, so a sound keeps playing after the sheet closes.
  const rain = useAudioPlayer(AMBIENT.rain.source);
  const waves = useAudioPlayer(AMBIENT.waves.source);
  const forest = useAudioPlayer(AMBIENT.forest.source);
  const players = useMemo(() => ({ rain, waves, forest }), [rain, waves, forest]);
  useEffect(() => {
    SOUND_IDS.forEach((k) => loopSoftly(players[k]));
  }, [players]);
  useEffect(() => {
    if (!focused) SOUND_IDS.forEach((k) => players[k].pause());
  }, [focused, players]);
  useEffect(() => {
    speak('Calm Space. Take a moment. You’ve got this.');
  }, []);
  const onPhase = useCallback((p: BreathPhase | undefined) => setPhase(p), []);
  const breathing = open === 'breathe';
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Landscape
        style={StyleSheet.absoluteFill}
        spec={{
          horizon: 0.44,
          ground: 0.5,
          clouds: [
            { x: 0.2, y: 0.22, s: 0.7 },
            { x: 0.82, y: 0.2, s: 0.7 },
          ],
          trees: [
            { x: 0.12, base: 0.56, h: 150 },
            { x: 0.24, base: 0.5, h: 50, tone: 'light' },
            { x: 0.28, base: 0.56, h: 60, tone: 'light' },
            { x: 0.72, base: 0.5, h: 56, tone: 'light' },
            { x: 0.88, base: 0.56, h: 150 },
          ],
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <Header title="Calm Space" subtitle="Take a moment. You’ve got this." right={<MyToolsButton />} />
      </View>
      <FitBox style={styles.hero} aspect={240 / 214} max={290} min={110}>
        {(size) => <Fox pose="meditate" size={size} breath={breathing ? breath : undefined} breathPhase={breathing ? phase : undefined} />}
      </FitBox>
      <View style={[styles.grid, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <NowPlaying players={players} onPress={() => setOpen('sounds')} />
        {MODULES.map((m, i) => (
          <Appear key={m.key} delay={i * 80} style={styles.cell}>
            <Tap
              onPress={() => {
                selectHaptic();
                setOpen(m.key);
              }}
              style={styles.tile}
              accessibilityLabel={m.label}
            >
              <Icon name={m.icon} size={62} />
              <Txt v="heading" center color={colors.text} style={{ marginTop: 10, fontSize: 21, fontFamily: 'Nunito_700Bold' }}>
                {m.label}
              </Txt>
            </Tap>
          </Appear>
        ))}
        {from === 'mission' ? <Button title="I’m ready — back to my quest" onPress={() => router.back()} style={{ width: '100%' }} /> : null}
      </View>

      <Sheet visible={breathing} onClose={() => setOpen(null)} title="Breathe" subtitle="In through your nose, out like blowing a bubble.">
        {breathing ? <BreatheModule breath={breath} onPhase={onPhase} /> : null}
      </Sheet>
      <Sheet visible={open === 'sounds'} onClose={() => setOpen(null)} title="Quiet Sounds" subtitle="Soft sounds to rest with. Tap again to stop.">
        <View style={{ gap: 10 }}>
          {SOUND_IDS.map((k) => (
            <SoundRow key={k} id={k} player={players[k]} />
          ))}
        </View>
      </Sheet>
      <Sheet visible={open === 'feelings'} onClose={() => setOpen(null)} title="My Feelings" subtitle="Your words, your way.">
        <FeelingsModule />
      </Sheet>
      <Sheet visible={open === 'focus'} onClose={() => setOpen(null)} title="Gentle Focus" subtitle="Look & find, nice and slow.">
        <FocusModule />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 110, paddingBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, paddingHorizontal: GUTTER - 6, backgroundColor: 'transparent' },
  cell: { width: '48.5%' },
  tile: { backgroundColor: '#FFFFFF', borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', paddingVertical: 22, ...shadows.soft },
  bubble: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#5DBE95', opacity: 0.9 },
  guideRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 3, borderColor: '#BFE8D6' },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%', backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, height: 40, ...shadows.soft },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 14, ...shadows.soft },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  msgGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  msg: { width: '48%', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 18 },
  bigMessage: { alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: radius.xl, paddingVertical: 42, paddingHorizontal: 16, ...shadows.card },
  sky: { height: 220, marginVertical: 12, borderRadius: radius.xl, backgroundColor: '#1F2D6B', overflow: 'hidden' },
  firefly: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFE38A', borderWidth: 4, borderColor: 'rgba(255, 240, 180, 0.55)' },
});

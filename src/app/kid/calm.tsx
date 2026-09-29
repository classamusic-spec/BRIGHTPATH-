import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Landscape } from '@/components/scenery/Landscape';
import { Appear, Button, FitBox, Header, Sheet, Tap, Txt } from '@/components/ui';
import { selectHaptic } from '@/lib/feedback';
import { useMotionLevel } from '@/lib/motion';
import { AMBIENT, playSound } from '@/lib/sound';
import { GUIDE } from '@/content/cast';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { colors, GUTTER, radius, shadows, tones } from '@/theme';

type Module = 'breathe' | 'sounds' | 'feelings' | 'focus' | null;

const MODULES: { key: Exclude<Module, null>; label: string; icon: IconName }[] = [
  { key: 'breathe', label: 'Breathe', icon: 'sprout' },
  { key: 'sounds', label: 'Quiet Sounds', icon: 'moon' },
  { key: 'feelings', label: 'My Feelings', icon: 'heart' },
  { key: 'focus', label: 'Gentle Focus', icon: 'sun' },
];

/* ---------------------------------------------------------------- Breathe */

function BreatheModule({ breath }: { breath: SharedValue<number> }) {
  const level = useMotionLevel();
  const [label, setLabel] = useState('Breathe in…');
  useEffect(() => {
    let alive = true;
    const cycle = () => {
      if (!alive) return;
      setLabel('Breathe in…');
      speak('Breathe in');
      breath.value = level === 'off' ? 1 : withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) });
      setTimeout(() => {
        if (!alive) return;
        setLabel('Breathe out…');
        speak('Breathe out');
        breath.value = level === 'off' ? 0 : withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) });
      }, 4000);
      setTimeout(cycle, 9000);
    };
    cycle();
    return () => {
      alive = false;
      cancelAnimation(breath);
    };
  }, [breath, level]);
  const bubble = useAnimatedStyle(() => ({ transform: [{ scale: 0.55 + breath.value * 0.45 }], opacity: 0.55 + breath.value * 0.35 }));
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.bubble, bubble]} />
        <Txt v="title" color="#FFFFFF" style={{ fontSize: 26 }}>
          {label}
        </Txt>
      </View>
      <Txt v="body" center color={colors.textSoft} style={{ marginTop: 10 }}>
        {`Follow the circle with ${GUIDE.name}. Stop any time.`}
      </Txt>
    </View>
  );
}

/* ----------------------------------------------------------- Quiet Sounds */

/** Ambient loops play quietly and keep going until the child stops them. */
function loopSoftly(player: AudioPlayer) {
  player.loop = true;
  player.volume = 0.7;
}

function SoundRow({ id }: { id: keyof typeof AMBIENT }) {
  const player = useAudioPlayer(AMBIENT[id].source);
  const [on, setOn] = useState(false);
  useEffect(() => loopSoftly(player), [player]);
  const toggle = () => {
    selectHaptic();
    if (on) player.pause();
    else player.play();
    setOn(!on);
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

function Firefly({ x, y, delay, onCatch }: { x: number; y: number; delay: number; onCatch: () => void }) {
  const level = useMotionLevel();
  const t = useSharedValue(0);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (level === 'off') return;
    t.value = withRepeat(withSequence(withTiming(1, { duration: 2600 + delay, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2600 + delay, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, [level, delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: hidden ? 0 : 0.6 + t.value * 0.4, transform: [{ translateY: -t.value * 18 }, { translateX: Math.sin(t.value * Math.PI) * 10 }, { scale: 0.9 + t.value * 0.2 }] }));
  if (hidden) return null;
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
      <Tap
        onPress={() => {
          playSound('sparkle', 0.3);
          setHidden(true);
          onCatch();
          setTimeout(() => setHidden(false), 2200);
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
  const { width } = useWindowDimensions();
  const [caught, setCaught] = useState(0);
  const spots = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ x: 20 + ((i * 97) % (width - 90)), y: 20 + ((i * 53) % 150), d: i * 350 })), [width]);
  return (
    <View>
      <Txt v="body" color={colors.textSoft}>
        Watch the gentle lights float. Tap one if you like — there’s no rush and no score.
      </Txt>
      <View style={styles.sky}>
        {spots.map((s, i) => (
          <Firefly key={i} x={s.x} y={s.y} delay={s.d} onCatch={() => setCaught((c) => c + 1)} />
        ))}
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
  const [open, setOpen] = useState<Module>(null);
  const breath = useSharedValue(0);
  const setQuiet = useApp((s) => s.setQuiet);
  useEffect(() => {
    speak('Calm Space. Take a moment. You’ve got this.');
  }, []);
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
        <Header title="Calm Space" subtitle="Take a moment. You’ve got this." />
      </View>
      <FitBox style={styles.hero} aspect={240 / 214} max={290} min={110}>
        {(size) => <Fox pose="meditate" size={size} breath={open === 'breathe' ? breath : undefined} />}
      </FitBox>
      <View style={[styles.grid, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        {MODULES.map((m, i) => (
          <Appear key={m.key} delay={i * 80} style={styles.cell}>
            <Tap
              onPress={() => {
                selectHaptic();
                if (m.key === 'sounds') setQuiet(true);
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
      </View>

      <Sheet visible={open === 'breathe'} onClose={() => setOpen(null)} title="Breathe" subtitle="In through your nose, out like blowing a bubble.">
        {open === 'breathe' ? <BreatheModule breath={breath} /> : null}
      </Sheet>
      <Sheet visible={open === 'sounds'} onClose={() => setOpen(null)} title="Quiet Sounds" subtitle="Soft sounds to rest with. Tap again to stop.">
        <View style={{ gap: 10 }}>
          {(Object.keys(AMBIENT) as (keyof typeof AMBIENT)[]).map((k) => (
            <SoundRow key={k} id={k} />
          ))}
        </View>
      </Sheet>
      <Sheet visible={open === 'feelings'} onClose={() => setOpen(null)} title="My Message" subtitle="Your words, your way.">
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
  bubble: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#5DBE95' },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 14, ...shadows.soft },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  msgGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  msg: { width: '48%', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 18 },
  bigMessage: { alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: radius.xl, paddingVertical: 42, paddingHorizontal: 16, ...shadows.card },
  sky: { height: 220, marginVertical: 12, borderRadius: radius.xl, backgroundColor: '#1F2D6B', overflow: 'hidden' },
  firefly: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFE38A', borderWidth: 4, borderColor: 'rgba(255, 240, 180, 0.55)' },
});

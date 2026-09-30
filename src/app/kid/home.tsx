import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { MyToolsSheet } from '@/components/kid/MyTools';
import { MapNode, WORLD_PINS, WORLD_VB, WorldMap } from '@/components/scenery/WorldMap';
import { BottomNav, Tap, Txt } from '@/components/ui';
import { useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { useLearner } from '@/store';
import { useTodayMission } from '@/store/derived';
import { colors, shadows } from '@/theme';

function MapPill({ icon, label, onPress, delay = 0 }: { icon: IconName; label: string; onPress: () => void; delay?: number }) {
  const level = useMotionLevel();
  const t = useSharedValue(0);
  useEffect(() => {
    if (level === 'off') {
      t.value = 0;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [level, delay, t]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -t.value * 3 }] }));
  return (
    <Animated.View style={bob}>
      <Tap
        onPress={() => {
          playSound('tap', 0.4);
          onPress();
        }}
        style={styles.pill}
        accessibilityLabel={label}
        scale={0.93}
      >
        <Icon name={icon} size={30} />
        <Txt v="heading" color={colors.ink} style={{ fontSize: 22 }}>
          {label}
        </Txt>
      </Tap>
    </Animated.View>
  );
}

const PIN_TOP = WORLD_PINS.explore.y;
const PIN_BOTTOM = WORLD_PINS.myWorld.y;

/**
 * Pin y positions (viewBox units) that keep every pill between the header and
 * the nav. The map covers the screen (slice, centred), so on short phones and
 * tall tablets the authored pins can land under the header or the nav; then
 * the four pins are spread linearly across the free band instead.
 */
function usePinY(screen: { w: number; h: number } | null, headerBottom: number, navTop: number) {
  const raw = (y: number) => y;
  if (!screen || !navTop) return raw;
  const s = Math.max(screen.w / WORLD_VB.w, screen.h / WORLD_VB.h);
  const top = (screen.h - WORLD_VB.h * s) / 2;
  const lo = headerBottom + 36;
  const hi = navTop - 40;
  if (hi - lo < 160) return raw;
  const toScreen = (y: number) => top + y * s;
  if (toScreen(PIN_TOP) >= lo && toScreen(PIN_BOTTOM) <= hi) return raw;
  return (y: number) => (lo + ((y - PIN_TOP) / (PIN_BOTTOM - PIN_TOP)) * (hi - lo) - top) / s;
}

/** 04 · Home / World Map */
export default function Home() {
  const insets = useSafeAreaInsets();
  const learner = useLearner();
  const today = useTodayMission(learner.id);
  const [tools, setTools] = useState(false);
  const [screen, setScreen] = useState<{ w: number; h: number } | null>(null);
  const [headerBottom, setHeaderBottom] = useState(0);
  const [navTop, setNavTop] = useState(0);
  const pinY = usePinY(screen, headerBottom, navTop);

  const onRoot = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!screen || screen.w !== width || screen.h !== height) setScreen({ w: width, h: height });
  };

  return (
    <View style={styles.root} onLayout={onRoot}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]} onLayout={(e) => setHeaderBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        <View style={styles.avatar}>
          <BuddyPortrait id={learner.buddy} size={66} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Txt v="title" style={{ fontSize: 30, lineHeight: 34 }} accessibilityRole="header">
            {`Hi ${learner.displayName}!`}
          </Txt>
          <Txt v="bodySm" color={colors.textSoft} style={{ fontSize: 15 }}>
            Small steps. Big progress.
          </Txt>
        </View>
        <Tap onPress={() => router.push('/gate')} accessibilityLabel="Grown-ups: settings" style={styles.gear} hitSlop={10}>
          <Icon name="gear" size={34} color="#1F6EF0" />
        </Tap>
      </View>

      <WorldMap style={StyleSheet.absoluteFill}>
        <MapNode x={WORLD_PINS.explore.x} y={pinY(WORLD_PINS.explore.y)}>
          <View style={styles.pinWrap}>
            <MapPill icon="mountain" label="Explore" delay={0} onPress={() => router.push({ pathname: '/kid/mission/[id]', params: { id: today.mission.id, step: '0' } })} />
          </View>
        </MapNode>
        <MapNode x={WORLD_PINS.quests.x} y={pinY(WORLD_PINS.quests.y)}>
          <View style={styles.pinWrap}>
            <MapPill icon="star" label="Quests" delay={400} onPress={() => router.push('/kid/quests')} />
          </View>
        </MapNode>
        <MapNode x={WORLD_PINS.calm.x} y={pinY(WORLD_PINS.calm.y)}>
          <View style={styles.pinWrap}>
            <MapPill icon="sprout" label="Calm Space" delay={800} onPress={() => router.push('/kid/calm')} />
          </View>
        </MapNode>
        <MapNode x={WORLD_PINS.myWorld.x} y={pinY(WORLD_PINS.myWorld.y)}>
          <View style={styles.pinWrap}>
            <MapPill icon="house" label="My Room" delay={1200} onPress={() => router.push('/kid/room')} />
          </View>
        </MapNode>
      </WorldMap>

      <View style={styles.nav} onLayout={(e) => setNavTop(e.nativeEvent.layout.y)}>
        <BottomNav
          active="home"
          items={[
            { key: 'home', label: 'Home', icon: 'tabHome', onPress: () => router.dismissTo('/kid/home') },
            // Tabs replace rather than stack, so Back leaves the kid area instead of cycling tabs.
            { key: 'quests', label: 'Quests', icon: 'tabStar', onPress: () => router.replace({ pathname: '/kid/quests', params: { tab: '1' } }) },
            { key: 'tools', label: 'Tools', icon: 'tabLeaf', onPress: () => setTools(true) },
            { key: 'progress', label: 'Progress', icon: 'tabBars', onPress: () => router.replace({ pathname: '/kid/room', params: { tab: '1' } }) },
            { key: 'profile', label: 'Profile', icon: 'tabPerson', onPress: () => router.replace({ pathname: '/kid/profile', params: { tab: '1' } }) },
          ]}
        />
      </View>
      <MyToolsSheet visible={tools} onClose={() => setTools(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#CDE7FC' },
  header: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadows.soft },
  gear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1 },
  pinWrap: { position: 'absolute', left: -200, width: 400, top: -30, height: 60, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    height: 58,
    borderRadius: 29,
    ...shadows.raised,
  },
});

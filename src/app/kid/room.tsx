import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import Svg from 'react-native-svg';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { MyToolsButton } from '@/components/kid/MyTools';
import { ROOM_PLACEMENT, ROOM_VB, RoomItemArt, RoomPlacedArt, RoomSceneArt, RUG_CENTER } from '@/components/scenery/RoomArt';
import { Appear, Button, Callout, CheckBadge, Header, PillTabs, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { GUIDE } from '@/content/cast';
import { BADGES, ROOM_ITEMS, type RoomItemId } from '@/content/rewards';
import { successHaptic } from '@/lib/feedback';
import { type MotionLevel, useMotionLevel } from '@/lib/motion';
import { playSound } from '@/lib/sound';
import { useApp, useLearner, useRewards } from '@/store';
import { colors, radius, shadows, tones } from '@/theme';

/** Room items back to front, as the scene draws them. */
const ROOM_ORDER = Object.keys(ROOM_PLACEMENT) as RoomItemId[];

/** One placed item on its own layer, so each can animate in and out (a plain fade when gentle, none when motion is off). */
function PlacedItem({ id, level }: { id: RoomItemId; level: MotionLevel }) {
  const entering = level === 'off' ? undefined : level === 'gentle' ? FadeIn.duration(260) : ZoomIn.springify().damping(12);
  return (
    <Animated.View entering={entering} exiting={level === 'off' ? undefined : FadeOut.duration(160)} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${ROOM_VB.w} ${ROOM_VB.h}`}>
        <RoomPlacedArt id={id} />
      </Svg>
    </Animated.View>
  );
}

/** Counts from `from` up to `to` (~60 ms a star, 1.2 s at most); shows `to` at once when motion is off. */
function useCountUp(from: number, to: number, enabled: boolean) {
  const steps = Math.max(0, to - from);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!enabled || !steps) return;
    const id = setInterval(() => setI((n) => (n + 1 >= steps ? (clearInterval(id), steps) : n + 1)), Math.min(60, 1200 / steps));
    return () => clearInterval(id);
  }, [steps, enabled]);
  return enabled && i < steps ? from + i : to;
}

/** 19 · Rewards / My Room — stars unlock items; nothing is ever taken away. */
export default function MyRoom() {
  const params = useLocalSearchParams<{ from?: string; gained?: string; earned?: string; unlocked?: string; tab?: string }>();
  const learner = useLearner();
  const rewards = useRewards();
  const togglePlaced = useApp((s) => s.togglePlaced);
  const level = useMotionLevel();
  const [tab, setTab] = useState<'rewards' | 'room'>('rewards');
  const [all, setAll] = useState(false);
  const fromMission = params.from === 'mission';
  const gained = Math.max(0, Number(params.gained ?? params.earned ?? 0) || 0);
  const fresh = (params.unlocked ?? '').split(',').filter((id): id is RoomItemId => ROOM_ITEMS.some((it) => it.id === id));
  const celebrate = fromMission && gained > 0;
  const stars = useCountUp(Math.max(0, rewards.stars - gained), rewards.stars, celebrate && level !== 'off');
  const next = ROOM_ITEMS.find((it) => it.unlockAt > rewards.stars);

  useEffect(() => {
    if (celebrate) {
      playSound('sparkle', 0.5);
      successHaptic();
    }
  }, [celebrate]);

  const place = (id: RoomItemId) => {
    playSound('tap', 0.4);
    togglePlaced(id);
    setTab('room');
  };

  return (
    <Screen
      header={<Header title="My Room" onBack={fromMission ? () => router.replace('/kid/done') : params.tab ? () => router.replace('/kid/home') : undefined} right={<MyToolsButton />} />}
      footer={fromMission ? <Button title="Continue" onPress={() => router.replace('/kid/done')} /> : undefined}
    >
      <PillTabs
        size="lg"
        items={[
          { key: 'rewards', label: 'Rewards' },
          { key: 'room', label: 'Room' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {celebrate ? (
        <Appear from="zoom" style={{ marginTop: 12 }}>
          <Callout tone="butter" art={<Icon name="star" size={40} />} title={`+${gained} star${gained === 1 ? '' : 's'}!`} text="Thanks for playing and trying your best." />
        </Appear>
      ) : null}
      {fresh.length ? (
        <Appear from="zoom" delay={150} style={{ marginTop: 10 }}>
          <Callout
            tone="white"
            art={
              <Svg width={44} height={44} viewBox="0 0 100 100">
                <RoomItemArt id={fresh[0]} />
              </Svg>
            }
            title="New for your room"
            text={`${fresh.map((id) => ROOM_ITEMS.find((it) => it.id === id)!.label).join(', ')}. Tap it to place it!`}
            style={shadows.soft}
          />
        </Appear>
      ) : null}

      {tab === 'rewards' ? (
        <>
          <View style={styles.starsCard} accessible accessibilityLabel={`${rewards.stars} stars`}>
            <Icon name="star" size={64} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Txt v="number" color={colors.ink} style={{ fontSize: 34 }}>
                {String(stars)}
              </Txt>
              <Txt v="bodyLg" color={colors.text} style={{ marginTop: -2 }}>
                Stars
              </Txt>
            </View>
            <Tap onPress={() => setAll(true)} style={styles.viewAll} accessibilityLabel="View all rewards">
              <Txt v="label" color={colors.text} style={{ fontSize: 18 }}>
                View All
              </Txt>
              <Icon name="chevronRight" size={20} color={colors.cobalt} />
            </Tap>
          </View>
          <View style={styles.itemGrid}>
            {ROOM_ITEMS.map((it, i) => {
              const unlocked = rewards.stars >= it.unlockAt;
              const placed = rewards.placed.includes(it.id);
              const isNew = fresh.includes(it.id);
              const art = (
                <Svg width={54} height={54} viewBox="0 0 100 100">
                  <RoomItemArt id={it.id} />
                </Svg>
              );
              return (
                <Appear key={it.id} delay={i * 50} style={{ width: '23%' }}>
                  {unlocked ? (
                    <Tap
                      onPress={() => place(it.id)}
                      style={[styles.item, placed ? styles.itemPlaced : null]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: placed }}
                      accessibilityLabel={`${it.label}${isNew ? ', new' : ''}`}
                      accessibilityHint={placed ? 'Take it out of your room' : 'Put it in your room'}
                      scale={0.94}
                    >
                      {art}
                      <Txt v="label" center color={colors.text} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 15, marginTop: 2 }}>
                        {it.label}
                      </Txt>
                      {placed ? <CheckBadge size={22} style={styles.check} /> : null}
                      {isNew ? (
                        <View style={styles.newChip}>
                          <Txt v="caption" color={colors.ink} style={{ fontSize: 12, fontFamily: 'Nunito_800ExtraBold' }}>
                            New!
                          </Txt>
                        </View>
                      ) : null}
                    </Tap>
                  ) : (
                    <View style={[styles.item, styles.itemLocked]} accessible accessibilityLabel={`${it.label}, unlocks at ${it.unlockAt} stars`}>
                      <View style={{ opacity: 0.35 }}>{art}</View>
                      <View style={styles.lock}>
                        <Icon name="lock" size={22} color={colors.text} />
                      </View>
                      <Txt v="label" center color={colors.text} style={{ fontSize: 14, marginTop: 2 }}>
                        {`${it.unlockAt} stars`}
                      </Txt>
                    </View>
                  )}
                </Appear>
              );
            })}
          </View>
          <Txt v="body" center color={colors.textSoft} style={{ marginTop: 10 }}>
            {next ? `${next.unlockAt - rewards.stars} more star${next.unlockAt - rewards.stars === 1 ? '' : 's'} for the ${next.label.toLowerCase()}` : 'Everything is unlocked. Make your room your own!'}
          </Txt>
          <Callout tone="white" art={<Fox pose="head" size={96} interactive={false} decorative />} text="Tap an item to put it in your room!" style={{ marginTop: 14, ...shadows.soft }} />
        </>
      ) : (
        <>
          <View style={styles.room}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${ROOM_VB.w} ${ROOM_VB.h}`}>
              <RoomSceneArt placed={[]} />
            </Svg>
            {ROOM_ORDER.filter((id) => rewards.placed.includes(id)).map((id) => (
              <PlacedItem key={id} id={id} level={level} />
            ))}
            <View style={styles.buddy} pointerEvents="none">
              {learner.buddy === GUIDE.id || !learner.buddy ? (
                <Fox pose="read" size={140} interactive={false} accessibilityLabel={`${GUIDE.name} reading in your room`} />
              ) : (
                <>
                  <View style={styles.buddyShadow} />
                  <BuddyPortrait id={learner.buddy} size={130} />
                </>
              )}
            </View>
          </View>
          <Txt v="body" color={colors.textSoft} style={{ marginTop: 12 }}>
            Tap an item to show or hide it in your room.
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {ROOM_ITEMS.filter((it) => rewards.stars >= it.unlockAt).map((it) => {
              const on = rewards.placed.includes(it.id);
              return (
                <Tap key={it.id} onPress={() => togglePlaced(it.id)} style={[styles.chip, on ? { backgroundColor: colors.primarySoft, borderColor: colors.primary } : null]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={it.label}>
                  <Svg width={26} height={26} viewBox="0 0 100 100">
                    <RoomItemArt id={it.id} />
                  </Svg>
                  <Txt v="label" color={colors.text}>
                    {it.label}
                  </Txt>
                </Tap>
              );
            })}
          </View>
        </>
      )}

      <Sheet visible={all} onClose={() => setAll(false)} title="All Rewards" subtitle="Stars you earn always stay yours.">
        <Txt v="subheading" style={{ marginBottom: 8 }}>
          Badges
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {rewards.badges.length === 0 ? (
            <Txt v="body" color={colors.textMuted}>
              Finish a mission to earn your first badge.
            </Txt>
          ) : (
            rewards.badges.map((b) => (
              <View key={b.id} style={{ alignItems: 'center', width: 96, padding: 10, borderRadius: 16, backgroundColor: '#FFFFFF' }}>
                <Icon name={BADGES[b.id].icon} size={44} />
                <Txt v="label" center>
                  {BADGES[b.id].title}
                </Txt>
              </View>
            ))
          )}
        </View>
        <Txt v="subheading" style={{ marginTop: 16, marginBottom: 8 }}>
          Room items
        </Txt>
        {ROOM_ITEMS.map((it) => (
          <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <Svg width={36} height={36} viewBox="0 0 100 100">
              <RoomItemArt id={it.id} />
            </Svg>
            <Txt v="body" style={{ flex: 1 }}>
              {it.label}
            </Txt>
            <Txt v="label" color={rewards.stars >= it.unlockAt ? colors.mintDeep : colors.text}>
              {rewards.stars >= it.unlockAt ? 'Unlocked' : `${it.unlockAt} stars`}
            </Txt>
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}

const BUDDY_BOX = 170;

const styles = StyleSheet.create({
  starsCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 14, borderRadius: radius.xl, backgroundColor: '#E4EEFC', ...shadows.soft },
  viewAll: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 18, height: 52, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadows.soft },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 14 },
  item: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.lg, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: 'transparent', ...shadows.soft },
  itemPlaced: { borderColor: colors.primary },
  itemLocked: { backgroundColor: '#F1F4FA', ...shadows.none },
  lock: { position: 'absolute', top: 24, alignSelf: 'center', width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: -6, right: -6 },
  newChip: { position: 'absolute', top: -8, left: -4, backgroundColor: tones.butter.fg, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  room: { marginTop: 14, borderRadius: radius.xl, overflow: 'hidden', aspectRatio: ROOM_VB.w / ROOM_VB.h, backgroundColor: '#F2CFA6', ...shadows.soft },
  // The fox's feet sit on the middle of the rug; its own shadow comes with the pose.
  buddy: { position: 'absolute', left: `${(RUG_CENTER.x / ROOM_VB.w) * 100}%`, top: `${(RUG_CENTER.y / ROOM_VB.h) * 100}%`, width: BUDDY_BOX, height: 150, marginLeft: -BUDDY_BOX / 2, marginTop: -140, alignItems: 'center', justifyContent: 'flex-end' },
  buddyShadow: { position: 'absolute', bottom: -6, width: 110, height: 20, borderRadius: 55, backgroundColor: 'rgba(90, 60, 30, 0.18)', alignSelf: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.line },
});

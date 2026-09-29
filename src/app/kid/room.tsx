import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { RoomItemArt, RoomSceneArt } from '@/components/scenery/RoomArt';
import { Appear, Button, Callout, Card, Header, PillTabs, Screen, Sheet, Tap, Txt } from '@/components/ui';
import { BADGES, ROOM_ITEMS } from '@/content/rewards';
import { successHaptic } from '@/lib/feedback';
import { playSound } from '@/lib/sound';
import { useApp, useLearner, useRewards } from '@/store';
import { colors, radius, shadows } from '@/theme';

/** 19 · Rewards / My Room — stars unlock items; nothing is ever taken away. */
export default function MyRoom() {
  const { from, earned } = useLocalSearchParams<{ from?: string; earned?: string }>();
  const learner = useLearner();
  const rewards = useRewards();
  const togglePlaced = useApp((s) => s.togglePlaced);
  const [tab, setTab] = useState<'rewards' | 'room'>('rewards');
  const [all, setAll] = useState(false);
  const fromMission = from === 'mission';
  const gained = Number(earned ?? 0);

  useEffect(() => {
    if (fromMission && gained > 0) {
      playSound('sparkle', 0.5);
      successHaptic();
    }
  }, [fromMission, gained]);

  return (
    <Screen
      header={<Header title="My Room" onBack={fromMission ? () => router.replace('/kid/done') : undefined} />}
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
      {fromMission && gained > 0 ? (
        <Appear from="zoom" style={{ marginTop: 12 }}>
          <Callout tone="butter" art={<Icon name="star" size={40} />} title={`+${gained} stars!`} text="Thanks for playing and trying your best." />
        </Appear>
      ) : null}

      {tab === 'rewards' ? (
        <>
          <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 14 }}>
            <Icon name="star" size={64} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Txt v="number" color={colors.mintDeep} style={{ fontSize: 32 }}>
                {String(rewards.stars)}
              </Txt>
              <Txt v="bodyLg" color={colors.text} style={{ marginTop: -2 }}>
                Stars
              </Txt>
            </View>
            <Tap onPress={() => setAll(true)} style={{ backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 18, height: 52, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadows.soft }} accessibilityLabel="View all rewards">
              <Txt v="label" color={colors.text} style={{ fontSize: 18 }}>
                View All
              </Txt>
              <Icon name="chevronRight" size={20} color={colors.cobalt} />
            </Tap>
          </Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 14 }}>
            {ROOM_ITEMS.slice(0, 6).map((it, i) => {
              const unlocked = rewards.stars >= it.unlockAt;
              return (
                <Appear key={it.id} delay={i * 60} style={{ width: '31.5%' }}>
                  <Card style={{ alignItems: 'center', paddingVertical: 14, opacity: unlocked ? 1 : 0.55 }} accessibilityLabel={`${it.label}${unlocked ? '' : `, unlocks at ${it.unlockAt} stars`}`}>
                    <Svg width={92} height={92} viewBox="0 0 100 100">
                      <RoomItemArt id={it.id} />
                    </Svg>
                    <Txt v="subheading" color={colors.text} style={{ fontSize: 19.5, marginTop: 4 }}>
                      {it.label}
                    </Txt>
                    {!unlocked ? (
                      <Txt v="caption" color={colors.textMuted}>{`${it.unlockAt} stars`}</Txt>
                    ) : null}
                  </Card>
                </Appear>
              );
            })}
          </View>
          <Callout tone="white" art={<Fox pose="head" size={96} interactive={false} />} text="Collect stars to make your room your own!" style={{ marginTop: 14, ...shadows.soft }} />
        </>
      ) : (
        <>
          <View style={{ marginTop: 14, borderRadius: radius.xl, overflow: 'hidden', aspectRatio: 390 / 300, ...shadows.soft }}>
            <Svg width="100%" height="100%" viewBox="0 0 390 300">
              <RoomSceneArt placed={rewards.placed} />
            </Svg>
            <View style={{ position: 'absolute', left: '36%', bottom: '8%' }}>
              <BuddyPortrait id={learner.buddy} size={120} />
            </View>
          </View>
          <Txt v="body" color={colors.textSoft} style={{ marginTop: 12 }}>
            Tap an item to show or hide it in your room.
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {ROOM_ITEMS.filter((it) => rewards.stars >= it.unlockAt).map((it) => {
              const on = rewards.placed.includes(it.id);
              return (
                <Tap key={it.id} onPress={() => togglePlaced(it.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: on ? colors.primarySoft : '#FFFFFF', borderWidth: 2, borderColor: on ? colors.primary : colors.line }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={it.label}>
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
            <Txt v="label" color={rewards.stars >= it.unlockAt ? colors.mintDeep : colors.textMuted}>
              {rewards.stars >= it.unlockAt ? 'Unlocked' : `${it.unlockAt} stars`}
            </Txt>
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}

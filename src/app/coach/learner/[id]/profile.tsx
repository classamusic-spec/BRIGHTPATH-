import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { withRouteLearner } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { RewardsProfile } from '@/components/shared/RewardsProfile';
import { Sheet, Txt } from '@/components/ui';
import { BADGES } from '@/content/rewards';
import type { Learner } from '@/engine/types';
import { useApp } from '@/store';
import { EMPTY_REWARDS } from '@/store/defaults';
import { colors, radius, tones } from '@/theme';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** 35 · Rewards / Profile (coach view). Stars and badges are rewards, kept apart from evidence. */
export default withRouteLearner(LearnerRewardsProfile);

function LearnerRewardsProfile({ learner }: { learner: Learner }) {
  const rewards = useApp((s) => s.rewards[learner.id] ?? EMPTY_REWARDS);
  const [stars, setStars] = useState(false);
  const go = (path: string, params: Record<string, string> = {}) => () => router.push({ pathname: path as never, params: { id: learner.id, ...params } } as never);
  const history = [...rewards.history].reverse().slice(0, 20);
  return (
    <>
      <RewardsProfile
        learner={learner}
        rewards={rewards}
        onEdit={go('/coach/learner/[id]/child')}
        onSettings={() => router.push('/coach/settings')}
        onStars={() => setStars(true)}
        onInterests={go('/coach/learner/[id]/interests')}
        onStrengths={go('/coach/learner/[id]/child', { section: 'strengths' })}
      />
      <Sheet visible={stars} onClose={() => setStars(false)} title={`${learner.displayName}’s stars & badges`} subtitle="Rewards for taking part. They are never used as evidence of a skill.">
        <Txt v="label" color={colors.ink} style={{ marginBottom: 8 }} accessibilityRole="header">{`${rewards.stars} star${rewards.stars === 1 ? '' : 's'}`}</Txt>
        {history.length === 0 ? (
          <Txt v="body" color={colors.textMuted} style={{ marginBottom: 12 }}>
            Stars appear here after a mission.
          </Txt>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.md, marginBottom: 14 }}>
            {history.map((h, i) => (
              <View key={`${h.at}${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft }}>
                <Icon name="star" size={24} />
                <Txt v="body" style={{ flex: 1 }}>
                  {h.reason}
                </Txt>
                <Txt v="caption" color={colors.textMuted}>{`+${h.stars} · ${dateOf(h.at)}`}</Txt>
              </View>
            ))}
          </View>
        )}
        <Txt v="label" color={colors.ink} style={{ marginBottom: 8 }} accessibilityRole="header">
          Badges
        </Txt>
        {rewards.badges.length === 0 ? (
          <Txt v="body" color={colors.textMuted}>
            Badges appear here after a mission.
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {rewards.badges.map((b) => {
              const info = BADGES[b.id];
              return (
                <View key={b.id} style={{ width: '47%', flexGrow: 1, backgroundColor: tones[info.tone].bg, borderRadius: radius.lg, alignItems: 'center', padding: 12 }} accessible accessibilityLabel={`${info.title} badge, earned ${dateOf(b.earnedAt)}`}>
                  <Icon name={info.icon} size={48} />
                  <Txt v="label" color={colors.ink} style={{ marginTop: 4 }}>
                    {info.title}
                  </Txt>
                  <Txt v="caption" color={colors.textMuted}>{`Earned ${dateOf(b.earnedAt)}`}</Txt>
                </View>
              );
            })}
          </View>
        )}
      </Sheet>
    </>
  );
}

import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { Icon } from '@/components/icons/Icon';
import { BuddyPortrait } from '@/components/kid/Buddy';
import { Appear, Card, Header, ListRow, Screen, Tap, Txt } from '@/components/ui';
import { interestLabel } from '@/content/interests';
import { BADGES } from '@/content/rewards';
import type { Learner, Rewards } from '@/engine/types';
import { colors, radius, shadows, tones } from '@/theme';

/**
 * 35 · Rewards / Profile. Shared by the child's Profile tab and the coach
 * view of a learner. Editing always goes through a grown-up.
 */
export function RewardsProfile({
  learner,
  rewards,
  onEdit,
  onSettings,
  onStars,
  onInterests,
  onStrengths,
  title = 'Rewards / Profile',
  headerRight,
  onBack,
}: {
  learner: Learner;
  rewards: Rewards;
  onEdit: () => void;
  onSettings: () => void;
  onStars: () => void;
  /** Without a handler the row is read-only: no chevron and no press. */
  onInterests?: () => void;
  onStrengths?: () => void;
  title?: string;
  /** Extra header controls, shown before the settings gear. */
  headerRight?: ReactNode;
  onBack?: () => void;
}) {
  const badges = rewards.badges.slice(-3);
  const interests = learner.interests.map(interestLabel).join(', ').toLowerCase();
  return (
    <Screen
      header={
        <Header
          title={title}
          onBack={onBack}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {headerRight}
              <Tap onPress={onSettings} accessibilityLabel="Settings (grown-ups)" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="gear" size={34} color="#1F6EF0" />
              </Tap>
            </View>
          }
        />
      }
    >
      <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 }}>
        <View style={{ width: 132, height: 132, borderRadius: 66, backgroundColor: '#CFE6FB', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
          <BuddyPortrait id={learner.buddy} size={132} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="display" style={{ fontSize: 34 }}>
            {learner.displayName}
          </Txt>
          {learner.age ? (
            <Txt v="bodyLg" color={colors.text} style={{ fontSize: 21 }}>
              {`${learner.age} years old`}
            </Txt>
          ) : null}
          <Tap onPress={onEdit} style={{ marginTop: 10, backgroundColor: colors.primarySoft, borderRadius: 16, height: 46, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Edit Profile">
            <Txt v="label" color={colors.text} style={{ fontSize: 18 }}>
              Edit Profile
            </Txt>
          </Tap>
        </View>
      </Appear>

      <Appear delay={80}>
        <Card onPress={onStars} style={{ marginTop: 16 }} accessibilityLabel={`My Stars: ${rewards.stars}`}>
          <ListRow icon="star" plainIcon tileSize={50} titleSize={21} title="My Stars" value={String(rewards.stars)} right={<Icon name="chevronRight" size={24} color={colors.cobalt} />} />
        </Card>
      </Appear>

      <Appear delay={140}>
        <Card style={{ marginTop: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt v="heading" color={colors.ink}>
              Recent Badges
            </Txt>
            <Tap onPress={onStars} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel="View all badges">
              <Txt v="label" color={colors.text}>
                View All
              </Txt>
              <Icon name="chevronRight" size={20} color={colors.cobalt} />
            </Tap>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {badges.length === 0 ? (
              <Txt v="body" color={colors.textMuted}>
                Badges appear here after a mission.
              </Txt>
            ) : (
              badges.map((b) => {
                const info = BADGES[b.id];
                return (
                  <View key={b.id} style={{ flex: 1, backgroundColor: tones[info.tone].bg, borderRadius: radius.lg, alignItems: 'center', paddingVertical: 14 }}>
                    <Icon name={info.icon} size={64} />
                    <Txt v="subheading" color={colors.ink} style={{ marginTop: 6 }}>
                      {info.title}
                    </Txt>
                    <Txt v="body" color={colors.textSoft}>
                      {info.sub}
                    </Txt>
                  </View>
                );
              })
            )}
          </View>
        </Card>
      </Appear>

      <Appear delay={200}>
        <Card style={{ marginTop: 14 }}>
          <ListRow
            iconNode={
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="heart" size={30} />
              </View>
            }
            titleSize={20.5}
            title="My Interests"
            subtitle={interests ? interests.charAt(0).toUpperCase() + interests.slice(1) : 'Add a few favourites'}
            onPress={onInterests}
          />
        </Card>
      </Appear>
      <Appear delay={240}>
        <Card style={{ marginTop: 12 }}>
          <ListRow icon="trophy" plainIcon tileSize={54} titleSize={20.5} title="My Strengths" subtitle={learner.strengths.length ? learner.strengths.join(', ') : 'Add strengths'} onPress={onStrengths} />
        </Card>
      </Appear>
      <Appear delay={300} style={{ marginTop: 14, backgroundColor: colors.skySoft, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...shadows.none }}>
        <View style={{ width: 96, height: 84, alignItems: 'center', justifyContent: 'flex-end' }}>
          <Fox pose="bust" size={96} wavePaw interactive={false} />
        </View>
        <View style={{ flex: 1, paddingVertical: 12, paddingRight: 12 }}>
          <Txt v="subheading" color={colors.ink} style={{ fontSize: 19 }}>
            You’re doing amazing!
          </Txt>
          <Txt v="body" color={colors.text} style={{ fontSize: 16 }}>
            Small steps make a big difference.
          </Txt>
        </View>
      </Appear>
    </Screen>
  );
}

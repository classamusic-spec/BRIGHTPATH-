import { router } from 'expo-router';

import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { RewardsProfile } from '@/components/shared/RewardsProfile';
import { EMPTY_REWARDS } from '@/store/defaults';
import { useApp } from '@/store';

/** 35 · Rewards / Profile (coach view). */
export default function LearnerRewardsProfile() {
  const learner = useRouteLearner();
  const rewards = useApp((s) => s.rewards[learner.id] ?? EMPTY_REWARDS);
  const go = (path: string) => () => router.push({ pathname: path as never, params: { id: learner.id } } as never);
  return (
    <RewardsProfile
      learner={learner}
      rewards={rewards}
      onEdit={go('/coach/learner/[id]/child')}
      onSettings={() => router.push('/coach/settings')}
      onStars={go('/coach/learner/[id]/report')}
      onInterests={go('/coach/learner/[id]/interests')}
      onStrengths={go('/coach/learner/[id]/child')}
    />
  );
}

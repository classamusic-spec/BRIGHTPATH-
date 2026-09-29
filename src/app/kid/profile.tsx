import { router } from 'expo-router';

import { RewardsProfile } from '@/components/shared/RewardsProfile';
import { useLearner, useRewards } from '@/store';

/** Child's Profile tab (reference 35). Edits go through the Parent Gate. */
export default function KidProfile() {
  const learner = useLearner();
  const rewards = useRewards();
  const grownUps = () => router.push('/gate');
  return (
    <RewardsProfile
      learner={learner}
      rewards={rewards}
      onEdit={grownUps}
      onSettings={grownUps}
      onStars={() => router.push('/kid/room')}
      onInterests={grownUps}
      onStrengths={grownUps}
    />
  );
}

import { router, useLocalSearchParams } from 'expo-router';

import { MyToolsButton } from '@/components/kid/MyTools';
import { RewardsProfile } from '@/components/shared/RewardsProfile';
import { useLearner, useRewards } from '@/store';

/** Child's Profile tab (reference 35). Edits go through the Parent Gate; interests and strengths are read-only here. */
export default function KidProfile() {
  const learner = useLearner();
  const rewards = useRewards();
  // Opened as a Home tab (which replaced Home): the back arrow returns Home.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return (
    <RewardsProfile
      title="My Profile"
      headerRight={<MyToolsButton />}
      onBack={tab ? () => router.replace('/kid/home') : undefined}
      learner={learner}
      rewards={rewards}
      onEdit={() => router.push({ pathname: '/gate', params: { next: `/coach/learner/${learner.id}/interests` } })}
      onSettings={() => router.push('/gate')}
      onStars={() => router.push('/kid/room')}
    />
  );
}

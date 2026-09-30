import { Redirect, Stack, usePathname } from 'expo-router';
import { Platform } from 'react-native';

import { MaxScale } from '@/components/ui/Txt';
import { stackAnimation, useMotionLevel } from '@/lib/motion';
import { isGateOpen, useGate } from '@/store/gate';
import { colors } from '@/theme';

// Automated web runs in development (screenshot tooling) skip the Parent Gate.
const automatedDevWeb = __DEV__ && Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.webdriver === true;

export default function CoachLayout() {
  const level = useMotionLevel();
  const until = useGate((s) => s.until);
  const pathname = usePathname();
  if (!automatedDevWeb && !isGateOpen(until)) {
    return <Redirect href={{ pathname: '/gate', params: { next: pathname } }} />;
  }
  // Top-level coach hubs fade rather than slide (none when motion is off).
  const soft = level === 'off' ? 'none' : 'fade';
  return (
    <MaxScale.Provider value={2}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: stackAnimation(level),
        }}
      >
        <Stack.Screen name="index" options={{ animation: soft }} />
        <Stack.Screen name="learners" options={{ animation: soft }} />
        <Stack.Screen name="goals" options={{ animation: soft }} />
        <Stack.Screen name="tools" options={{ animation: soft }} />
        <Stack.Screen name="settings" options={{ animation: soft }} />
        <Stack.Screen name="learner/[id]/index" options={{ animation: soft }} />
        <Stack.Screen name="learner/[id]/growth-map" options={{ animation: soft }} />
        <Stack.Screen name="learner/[id]/insights" options={{ animation: soft }} />
      </Stack>
    </MaxScale.Provider>
  );
}

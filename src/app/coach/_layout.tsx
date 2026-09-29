import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function CoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
    </Stack>
  );
}

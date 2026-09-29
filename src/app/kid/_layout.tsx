import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function KidLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="home" options={{ animation: 'fade' }} />
      <Stack.Screen name="done" options={{ animation: 'fade' }} />
    </Stack>
  );
}

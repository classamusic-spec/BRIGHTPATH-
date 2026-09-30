import { router, Stack, type ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { Button, Canvas, Txt } from '@/components/ui';
import { stackAnimation, useMotionLevel } from '@/lib/motion';
import { colors } from '@/theme';

/** Gentle, blame-free fallback if a kid screen breaks. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.error}>
      <Canvas />
      <Fox pose="head" size={150} interactive={false} decorative />
      <Txt v="title" center accessibilityRole="header" style={{ marginTop: 10, marginBottom: 24 }}>
        Something got tangled — let’s try again
      </Txt>
      <View style={{ alignSelf: 'stretch', gap: 12 }}>
        <Button title="Try again" onPress={() => void retry()} />
        <Button title="Go home" kind="white" onPress={() => router.replace('/kid/home')} />
      </View>
    </View>
  );
}

export default function KidLayout() {
  const level = useMotionLevel();
  // Hubs and calm spaces fade in rather than slide (none when motion is off).
  const soft = level === 'off' ? 'none' : 'fade';
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: stackAnimation(level),
      }}
    >
      <Stack.Screen name="index" options={{ animation: soft }} />
      <Stack.Screen name="home" options={{ animation: soft }} />
      <Stack.Screen name="done" options={{ animation: soft }} />
      <Stack.Screen name="quests" options={{ animation: soft }} />
      <Stack.Screen name="room" options={{ animation: soft }} />
      <Stack.Screen name="profile" options={{ animation: soft }} />
      <Stack.Screen name="calm" options={{ animation: soft }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: colors.bg },
});

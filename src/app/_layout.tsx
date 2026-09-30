import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SunMark } from '@/components/kid/Brand';
import { Button, Canvas, Txt } from '@/components/ui';
import { useAnnouncement } from '@/lib/announce';
import { stackAnimation, useMotionLevel } from '@/lib/motion';
import { useApp } from '@/store';
import { useGate } from '@/store/gate';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 300 });

/** Visually hidden polite live region for web announcements (see lib/announce). */
function LiveRegion() {
  const message = useAnnouncement((s) => s.message);
  if (Platform.OS !== 'web') return null;
  return (
    <View aria-live="polite" accessibilityLiveRegion="polite" style={styles.srOnly} testID="bp-live-region">
      <Txt>{message}</Txt>
    </View>
  );
}

/** Calm fallback when something unexpected breaks outside the kid space. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.error}>
      <Canvas />
      <SunMark size={120} />
      <Txt v="title" center accessibilityRole="header" style={{ marginTop: 8 }}>
        Something went wrong
      </Txt>
      <Txt v="bodyLg" center color={colors.textSoft} style={{ marginTop: 6, marginBottom: 22 }}>
        Nothing is lost. Let’s try that again.
      </Txt>
      <Button title="Try again" onPress={() => void retry()} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const hydrated = useApp((s) => s.hydrated);
  const level = useMotionLevel();
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Leaving the app closes the grown-up space; the Parent Gate asks again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') useGate.getState().lock();
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: stackAnimation(level),
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="gate" options={{ animation: level === 'full' ? 'fade_from_bottom' : level === 'gentle' ? 'fade' : 'none' }} />
        </Stack>
        <LiveRegion />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, left: -1000, top: 0 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: colors.bg },
});

import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { speak, stopSpeaking, useSpeaking } from '@/lib/speech';
import { colors, shadows } from '@/theme';

import { Tap } from './Tap';

/** Speaker button that reads `text` aloud on request; tapping again while speaking stops. */
export function ReadAloudButton({ text, style, color = colors.primary }: { text: string; style?: StyleProp<ViewStyle>; color?: string }) {
  const speaking = useSpeaking((s) => s.speaking);
  return (
    <Tap
      onPress={() => (speaking ? stopSpeaking() : speak(text, { force: true }))}
      accessibilityLabel="Read this to me"
      accessibilityState={{ busy: speaking }}
      style={[styles.btn, speaking ? styles.on : null, style]}
      hitSlop={6}
    >
      <Icon name="speaker" size={24} color={speaking ? colors.onPrimary : color} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  btn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  on: { backgroundColor: colors.primaryPressed },
});

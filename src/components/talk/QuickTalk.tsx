import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Tap, Txt } from '@/components/ui';
import { QUICK_CARDS, WORD_CLASS_COLORS } from '@/content/talk';
import { sayAloud } from '@/lib/speech';
import { colors, fonts, GUTTER } from '@/theme';

import { TalkPicture } from './TalkPicture';

/**
 * The quick-need cards (yes, no, help me, bathroom, break, hurt, stop, all
 * done). Each one speaks its whole phrase straight away, on the Talk board
 * and in My Tools, so the most urgent things are never more than a tap or two away.
 */
export function QuickTalk({
  compact = false,
  gutter = GUTTER,
  lead,
  style,
}: {
  compact?: boolean;
  gutter?: number;
  /** Shown before the quick cards (e.g. the way into the Talk board). */
  lead?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const size = compact ? 30 : 36;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={{ gap: compact ? 8 : 9, paddingHorizontal: gutter, paddingVertical: 4 }}
      accessibilityLabel="Quick words"
    >
      {lead}
      {QUICK_CARDS.map((c) => {
        const k = WORD_CLASS_COLORS[c.cls];
        return (
          <Tap
            key={c.id}
            onPress={() => sayAloud(c.say)}
            scale={0.9}
            style={[styles.card, compact ? styles.compact : null, { backgroundColor: k.bg, borderColor: k.edge }]}
            accessibilityLabel={c.say}
            accessibilityHint="Says it out loud"
          >
            <TalkPicture symbol={c.symbol} size={size} />
            <View style={{ alignSelf: 'stretch' }}>
              <Txt v="label" color={colors.ink} center numberOfLines={1} style={compact ? { ...styles.label, fontSize: 12.5 } : styles.label}>
                {c.label}
              </Txt>
            </View>
          </Tap>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { width: 76, height: 72, borderRadius: 16, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  compact: { width: 68, height: 62, borderRadius: 14 },
  label: { fontFamily: fonts.extrabold, fontSize: 13.5, lineHeight: 17, marginTop: 2 },
});

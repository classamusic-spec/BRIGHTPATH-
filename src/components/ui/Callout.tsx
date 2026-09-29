import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, tones, type Tone } from '@/theme';

import { Txt } from './Txt';

/** Soft encouragement banner: art on the left, one or two short lines. */
export function Callout({
  art,
  title,
  text,
  tone = 'sky',
  style,
  center,
  textSize = 20,
}: {
  art?: ReactNode;
  title?: string;
  text: string;
  tone?: Tone | 'white' | 'plain';
  style?: StyleProp<ViewStyle>;
  center?: boolean;
  /** Size of the line when there is no title (kid screens read big). */
  textSize?: number;
}) {
  const bg = tone === 'plain' ? 'transparent' : tone === 'white' ? colors.card : tones[tone].bg;
  return (
    <View style={[styles.box, { backgroundColor: bg }, center ? { justifyContent: 'center' } : null, style]}>
      {art ? <View style={styles.art}>{art}</View> : null}
      <View style={{ flexShrink: 1 }}>
        {title ? (
          <Txt v="subheading" color={colors.ink} style={{ fontSize: 18 }}>
            {title}
          </Txt>
        ) : null}
        <Txt v="body" color={title ? colors.textSoft : colors.text} style={{ fontSize: title ? 15 : textSize, lineHeight: title ? 20 : Math.round(textSize * 1.3) }}>
          {text}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 16, gap: 14 },
  art: { alignItems: 'center', justifyContent: 'center' },
});

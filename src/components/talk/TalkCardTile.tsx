import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Tap, Txt } from '@/components/ui';
import { WORD_CLASS_COLORS } from '@/content/talk';
import type { BoardCard } from '@/store/talk';
import { colors, fonts, shadows } from '@/theme';

import { TalkPicture } from './TalkPicture';

const PAD = 6;
const BORDER = 2.5;

/** Size of a card for a given width: room for the picture and two lines of words. */
export function tileMetrics(width: number, showWords: boolean) {
  if (!showWords) return { height: width, picture: Math.round(width * 0.74), font: 0, lineHeight: 0 };
  const font = Math.max(12, Math.min(19, Math.round(width * 0.165)));
  const lineHeight = Math.round(font * 1.15);
  const picture = Math.round(width * 0.54);
  return { height: picture + 4 + 2 * lineHeight + 2 * PAD + 2 * BORDER, picture, font, lineHeight };
}

/** One picture card on the Talk board, coloured by word type (Modified Fitzgerald Key). Without `onPress` it is a still preview. */
export const TalkCardTile = memo(function TalkCardTile({
  card,
  width,
  showWords,
  onPress,
  hint,
}: {
  card: BoardCard;
  width: number;
  showWords: boolean;
  onPress?: (card: BoardCard) => void;
  hint?: string;
}) {
  const c = WORD_CLASS_COLORS[card.cls];
  const m = tileMetrics(width, showWords);
  const style = [styles.card, { width, height: m.height, backgroundColor: c.bg, borderColor: c.edge }];
  const body = (
    <>
      <TalkPicture symbol={card.symbol} photo={card.photo} size={m.picture} />
      {showWords ? (
        <Txt
          v="label"
          color={colors.ink}
          center
          numberOfLines={2}
          style={{ fontFamily: fonts.extrabold, fontSize: card.label.length > 12 ? m.font - 1 : m.font, lineHeight: m.lineHeight, marginTop: 4 }}
        >
          {card.label}
        </Txt>
      ) : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={style} accessible accessibilityRole="image" accessibilityLabel={`Card preview: ${card.label}`}>
        {body}
      </View>
    );
  }
  return (
    <Tap onPress={() => onPress(card)} scale={0.92} style={style} accessibilityLabel={card.label} accessibilityHint={hint}>
      {body}
    </Tap>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: PAD,
    ...shadows.soft,
  },
});

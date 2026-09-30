import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/icons/Icon';
import { Appear, Tap, Txt } from '@/components/ui';
import { WORD_CLASS_COLORS } from '@/content/talk';
import { useMotionLevel } from '@/lib/motion';
import { useTalkVoice } from '@/lib/speech';
import type { BoardCard } from '@/store/talk';
import { colors, fonts, radius, shadows } from '@/theme';

import { TalkPicture } from './TalkPicture';

export type MessageItem = { key: string; card: BoardCard };

/**
 * The message strip: the cards a child has put together. Tapping it says the
 * whole message; the speaker glows while the voice is talking.
 */
export function MessageBar({ items, onSpeak, onBackspace, onClear }: { items: MessageItem[]; onSpeak: () => void; onBackspace: () => void; onClear: () => void }) {
  const level = useMotionLevel();
  const talking = useTalkVoice((s) => s.talking);
  const scroller = useRef<ScrollView>(null);
  const empty = items.length === 0;

  const glow = useSharedValue(0);
  useEffect(() => {
    if (talking && level !== 'off') {
      glow.set(withRepeat(withTiming(1, { duration: 560, easing: Easing.inOut(Easing.sin) }), -1, true));
    } else {
      cancelAnimation(glow);
      glow.set(withTiming(0, { duration: 180 }));
    }
    return () => cancelAnimation(glow);
  }, [talking, level, glow]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.15 + glow.get() * 0.35, transform: [{ scale: 1 + glow.get() * 0.14 }] }));

  const sentence = items.map((m) => m.card.label).join(' ');
  return (
    <View style={styles.row}>
      <Tap
        onPress={onSpeak}
        disabled={empty}
        scale={0.98}
        style={styles.strip}
        accessibilityLabel={empty ? 'Message. Tap pictures to add words.' : `Say it: ${sentence}`}
        accessibilityHint={empty ? undefined : 'Says your whole message'}
      >
        <View style={styles.speakWrap}>
          <Animated.View style={[styles.speakRing, ring, talking && level === 'off' ? { opacity: 0.5 } : null]} />
          <View style={[styles.speak, empty ? { backgroundColor: '#AFC3E8' } : null]}>
            <Icon name="speaker" size={26} color="#FFFFFF" />
          </View>
        </View>
        {empty ? (
          <Txt v="body" color={colors.textMuted} style={{ flex: 1, fontSize: 16.5 }} numberOfLines={2}>
            Tap pictures to talk
          </Txt>
        ) : (
          <ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.words}
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: level !== 'off' })}
          >
            {items.map((m) => (
              <Appear key={m.key} from="zoom">
                <View style={[styles.word, { borderColor: WORD_CLASS_COLORS[m.card.cls].edge }]}>
                  <TalkPicture symbol={m.card.symbol} photo={m.card.photo} size={30} />
                  <Txt v="tiny" color={colors.ink} numberOfLines={1} style={styles.wordText}>
                    {m.card.label}
                  </Txt>
                </View>
              </Appear>
            ))}
          </ScrollView>
        )}
      </Tap>
      <View style={styles.sideCol}>
        <Tap onPress={onBackspace} disabled={empty} style={styles.side} accessibilityLabel="Delete the last word" scale={0.9}>
          <Icon name="backspace" size={26} color={colors.cobalt} />
        </Tap>
        <Tap onPress={onClear} disabled={empty} style={styles.side} accessibilityLabel="Clear the message" scale={0.9}>
          <Icon name="close" size={22} color={colors.cobalt} />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  strip: {
    flex: 1,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primaryTint,
    paddingLeft: 10,
    paddingRight: 6,
    ...shadows.card,
  },
  speakWrap: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  speakRing: { position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary },
  speak: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  words: { alignItems: 'center', gap: 6, paddingVertical: 8, paddingRight: 4 },
  word: { minWidth: 54, maxWidth: 92, height: 66, borderRadius: 12, borderWidth: 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  wordText: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 15, marginTop: 2 },
  sideCol: { gap: 8, justifyContent: 'space-between' },
  side: { width: 48, flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
});

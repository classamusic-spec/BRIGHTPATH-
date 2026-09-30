import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { TALK_SYMBOLS, type SymbolId } from '@/content/talkSymbols';

/** A Talk card's picture: the child's own photo, or a symbol from the library. Decorative: the card carries the words. */
export function TalkPicture({ symbol, photo, size, style }: { symbol: SymbolId; photo?: string; size: number; style?: StyleProp<ImageStyle> }) {
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[{ width: size, height: size, borderRadius: Math.round(size * 0.2) }, style]}
        resizeMode="cover"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return <Image source={TALK_SYMBOLS[symbol]} style={[{ width: size, height: size }, style]} resizeMode="contain" accessible={false} />;
}

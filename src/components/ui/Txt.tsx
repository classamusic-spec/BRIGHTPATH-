import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type } from '@/theme';

type Variant = keyof typeof type;

export type TxtProps = TextProps & {
  v?: Variant;
  color?: string;
  center?: boolean;
  style?: TextStyle | TextStyle[];
};

/** Themed text. Defaults to body copy in BrightPath navy-blue. */
export function Txt({ v = 'body', color, center, style, ...rest }: TxtProps) {
  const base = type[v];
  const defaultColor =
    v === 'logo' || v === 'display' || v === 'title' || v === 'titleSm' || v === 'heading' || v === 'subheading' || v === 'number'
      ? colors.ink
      : colors.text;
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[base, { color: color ?? defaultColor }, center ? { textAlign: 'center' } : null, style as TextStyle]}
    />
  );
}

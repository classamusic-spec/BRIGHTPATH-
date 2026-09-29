import type { TextStyle } from 'react-native';

/** Nunito weights loaded in the root layout. */
export const fonts = {
  regular: 'Nunito_600SemiBold',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

type Variant =
  | 'logo'
  | 'display'
  | 'title'
  | 'titleSm'
  | 'heading'
  | 'subheading'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'caption'
  | 'tiny'
  | 'button'
  | 'buttonSm'
  | 'number';

export const type: Record<Variant, TextStyle> = {
  logo: { fontFamily: fonts.black, fontSize: 44, lineHeight: 50, letterSpacing: -0.6 },
  display: { fontFamily: fonts.black, fontSize: 34, lineHeight: 40, letterSpacing: -0.4 },
  title: { fontFamily: fonts.black, fontSize: 27, lineHeight: 33, letterSpacing: -0.3 },
  titleSm: { fontFamily: fonts.black, fontSize: 23, lineHeight: 29, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.extrabold, fontSize: 21, lineHeight: 27 },
  subheading: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 25 },
  body: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  bodySm: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17 },
  tiny: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
  button: { fontFamily: fonts.extrabold, fontSize: 23, lineHeight: 28 },
  buttonSm: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22 },
  number: { fontFamily: fonts.black, fontSize: 30, lineHeight: 34 },
};

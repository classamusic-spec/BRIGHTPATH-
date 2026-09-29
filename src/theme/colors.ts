/**
 * BrightPath locked palette (Framework §58). Values sampled from the approved
 * v2 UI/UX reference boards: pale-blue canvas, navy/cobalt headings, primary
 * blue CTAs and mint / yellow / coral / lavender semantic accents.
 */
export const colors = {
  // Canvas
  bg: '#F3F8FD',
  bgTop: '#EAF4FD',
  bgDeep: '#E3EFFB',
  card: '#FFFFFF',
  cardSoft: '#F6F9FE',
  cardTint: '#EEF4FD',
  line: '#E4EBF6',
  lineSoft: '#EDF2F9',

  // Text
  ink: '#0B1494',
  inkDeep: '#08107A',
  text: '#1E2A9E',
  textSoft: '#4553B4',
  textMuted: '#7F8AC4',
  textFaint: '#A7B0D8',
  onPrimary: '#FFFFFF',

  // Brand blues
  primary: '#2880FC',
  primaryPressed: '#1B6CE6',
  primaryDeep: '#1459D4',
  primarySoft: '#E2EEFE',
  primaryTint: '#D4E6FE',
  cobalt: '#2447D8',

  // Semantic accents
  mint: '#4CC478',
  mintDeep: '#2F9E5E',
  mintSoft: '#DDF6E6',
  mintTint: '#EAF9EF',
  teal: '#2E9C7A',
  tealDeep: '#23806A',
  sky: '#7CBCFC',
  skyDeep: '#3F8FF0',
  skySoft: '#DCEEFD',
  butter: '#FCC83C',
  butterDeep: '#F2A91C',
  butterSoft: '#FDF3D8',
  lavender: '#B690FA',
  lavenderDeep: '#8E63EE',
  lavenderSoft: '#ECE6FD',
  blush: '#F7839C',
  blushDeep: '#EE5A7C',
  blushSoft: '#FDE6EE',
  coral: '#F25F6F',
  orange: '#F4793A',
  orangeSoft: '#FDEBDD',

  // Illustration
  heart: '#F4607F',
  heartLight: '#FF9BB0',
  star: '#FDC53A',
  starDeep: '#F4A51C',
  leaf: '#3FAE72',
  leafDeep: '#2A8C58',
  tree: '#2E9678',
  treeLight: '#43B08C',
  trunk: '#6B4A3A',
  grass: '#CDEFA0',
  grassMid: '#A9DE84',
  grassDeep: '#7CC96A',
  hill: '#B8E69A',
  sky1: '#DDF1FD',
  sky2: '#F2FAFE',
  cloud: '#FFFFFF',
  sun: '#FDC63F',
  sunRay: '#FDCB4A',
  water: '#6DB8F7',
  waterLight: '#A6D6FB',
  path: '#F3DDB0',
  pathEdge: '#E8C993',
  mountain: '#6E9DF0',
  mountainDeep: '#3E6FDB',

  // Fox
  fox: '#F4772E',
  foxLight: '#FB9650',
  foxDeep: '#DE5A1C',
  foxCream: '#FFF6EC',
  foxCreamShade: '#F6E2D2',
  foxDark: '#5B2E1F',
  foxEarInner: '#F9B7A2',
  backpack: '#2C73E0',
  backpackLight: '#4A92F2',
  backpackDeep: '#1B55B8',

  // Matrix / status
  statusGood: '#7FD49A',
  statusGoodSoft: '#BFEBCB',
  statusSome: '#FBD978',
  statusSomeSoft: '#FCE7AE',
  statusNeeds: '#F7889A',
  statusNone: '#E6EAF3',
  statusExplore: '#C3A6F7',

  shadow: '#2E4A8C',
  overlay: 'rgba(12, 22, 74, 0.38)',
} as const;

export type ColorName = keyof typeof colors;

/** Soft tile pairs used by icon tiles, feeling cards and response rows. */
export const tones = {
  mint: { bg: colors.mintSoft, fg: colors.mint, deep: colors.mintDeep, border: '#A9E3BE' },
  sky: { bg: colors.skySoft, fg: colors.sky, deep: colors.skyDeep, border: '#A9D2FB' },
  butter: { bg: colors.butterSoft, fg: colors.butter, deep: colors.butterDeep, border: '#F6D98A' },
  lavender: { bg: colors.lavenderSoft, fg: colors.lavender, deep: colors.lavenderDeep, border: '#CDB9F8' },
  blush: { bg: colors.blushSoft, fg: colors.blush, deep: colors.blushDeep, border: '#F7B7C6' },
  blue: { bg: colors.primarySoft, fg: colors.primary, deep: colors.primaryDeep, border: '#A9CBFB' },
  orange: { bg: colors.orangeSoft, fg: colors.orange, deep: '#D95E22', border: '#F8C39F' },
  white: { bg: colors.card, fg: colors.primary, deep: colors.ink, border: colors.line },
} as const;

export type Tone = keyof typeof tones;

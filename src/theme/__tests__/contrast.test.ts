import { colors, tones } from '../colors';

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;
const surfaces = { card: colors.card, bg: colors.bg, cardTint: colors.cardTint } as const;
const textTokens = ['ink', 'inkDeep', 'text', 'textSoft', 'textMuted', 'heading', 'alertText', 'mintText', 'dangerText', 'cobalt'] as const;

describe('text tokens meet WCAG AA (4.5:1)', () => {
  for (const t of textTokens) {
    for (const [name, bg] of Object.entries(surfaces)) {
      it(`${t} on ${name}`, () => {
        expect(contrast(colors[t], bg)).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  it('small white text sits on primaryPressed', () => {
    expect(contrast(colors.onPrimary, colors.primaryPressed)).toBeGreaterThanOrEqual(AA);
  });

  it('chip text on its tinted fills', () => {
    expect(contrast(colors.mintText, tones.mint.bg)).toBeGreaterThanOrEqual(AA);
    expect(contrast(colors.dangerText, tones.blush.bg)).toBeGreaterThanOrEqual(AA);
    expect(contrast(colors.text, tones.blue.bg)).toBeGreaterThanOrEqual(AA);
    expect(contrast(colors.textMuted, '#EEF2F9')).toBeGreaterThanOrEqual(AA);
  });

  it('bottom nav inactive label on white', () => {
    expect(contrast('#5F72B5', colors.card)).toBeGreaterThanOrEqual(AA);
  });
});

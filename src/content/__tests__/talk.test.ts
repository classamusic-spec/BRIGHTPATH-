import { GUIDE } from '../cast';
import { BANNED_PATTERNS, BANNED_WORDS } from '../governance';
import { ALL_TALK_CARDS, QUICK_CARDS, TALK_CATEGORIES, talkCardById, WORD_CLASS_COLORS } from '../talk';
import { TALK_SYMBOLS } from '../talkSymbols';

// Node's fs and path, typed just enough: the app's tsconfig only loads Jest's types.
declare const __dirname: string;
const fs = jest.requireActual<{ readdirSync(dir: string): string[] }>('fs');
const path = jest.requireActual<{ join(...parts: string[]): string }>('path');

const subcategories = TALK_CATEGORIES.flatMap((c) => c.subcategories);

describe('Talk board vocabulary', () => {
  it('gives every card, category and subcategory a unique id', () => {
    const ids = ALL_TALK_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(TALK_CATEGORIES.map((c) => c.id)).size).toBe(TALK_CATEGORIES.length);
    expect(new Set(subcategories.map((s) => s.id)).size).toBe(subcategories.length);
  });

  it('covers many topics, each subcategory with pictures in it', () => {
    expect(TALK_CATEGORIES.length).toBeGreaterThanOrEqual(12);
    expect(subcategories.length).toBeGreaterThanOrEqual(40);
    expect(ALL_TALK_CARDS.length).toBeGreaterThan(500);
    for (const s of subcategories) expect(s.cards.length).toBeGreaterThan(0);
  });

  it('keeps the Core board first and in a fixed order', () => {
    const [core] = TALK_CATEGORIES;
    expect(core.id).toBe('core');
    const words = core.subcategories.flatMap((s) => s.cards.map((c) => c.label));
    expect(words).toHaveLength(36);
    expect(words.slice(0, 4)).toEqual(['I', 'you', 'want', 'like']);
  });

  it('always offers the quick needs as whole phrases', () => {
    expect(QUICK_CARDS.map((c) => c.label)).toEqual(['yes', 'no', 'help me', 'bathroom', 'break', 'hurt', 'stop', 'all done']);
    for (const c of QUICK_CARDS) expect(c.say.trim()).not.toBe('');
  });

  it('has a rendered picture for every card and no stray picture files', () => {
    const used = new Set([...ALL_TALK_CARDS.map((c) => c.symbol), ...TALK_CATEGORIES.map((c) => c.symbol), ...subcategories.map((s) => s.symbol)]);
    for (const s of used) expect(TALK_SYMBOLS).toHaveProperty([s]);
    // Run `npm run talk:symbols` after changing symbols in talk.ts.
    const dir = path.join(__dirname, '../../../assets/talk');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.png'))
      .map((f) => f.slice(0, -4))
      .sort();
    expect(files).toEqual(Object.keys(TALK_SYMBOLS).sort());
  });

  it('shows the guide by name while the card id stays stable', () => {
    const card = talkCardById('buddies.guide');
    expect(card?.label).toBe(GUIDE.name);
    expect(card?.say).toBe(GUIDE.name);
  });

  it('colours every card by a known word type', () => {
    for (const c of ALL_TALK_CARDS) expect(WORD_CLASS_COLORS[c.cls]).toBeDefined();
  });

  it('uses no labelling or punitive wording', () => {
    for (const c of ALL_TALK_CARDS) {
      const text = `${c.label} ${c.say}`.toLowerCase();
      for (const w of BANNED_WORDS) expect(text).not.toContain(w);
      for (const p of BANNED_PATTERNS) expect(text).not.toMatch(p.re);
    }
  });
});

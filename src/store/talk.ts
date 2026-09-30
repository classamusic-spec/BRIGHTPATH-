import { talkCardById, type TalkCard, type WordClass } from '@/content/talk';
import type { SymbolId } from '@/content/talkSymbols';

/** A word or photo a grown-up added to one child's Talk board. */
export interface TalkCustomCard {
  id: string;
  label: string;
  /** What the voice says (defaults to the label). */
  say: string;
  cls: WordClass;
  /** A picture from the Talk library, shown when there is no photo. */
  symbol: SymbolId;
  /** A small square photo kept on this device (a data URL). */
  photo?: string;
}

/**
 * One child's Talk board settings. What a child says on the board is their
 * voice, not a performance: it is never recorded as evidence.
 */
export interface TalkPrefs {
  /** Cards per row on a phone (wider screens fit more). */
  columns: 3 | 4 | 5;
  /** Say each word as it is tapped. The whole message can always be spoken. */
  speakOnTap: boolean;
  showWords: boolean;
  /** Topic categories put away for now. Core, Quick and My words always show. */
  hidden: string[];
  custom: TalkCustomCard[];
  /** Keep a short list of recently used cards on this device. */
  keepRecents: boolean;
  /** Card ids, most recent first. */
  recents: string[];
}

export const DEFAULT_TALK: TalkPrefs = {
  columns: 4,
  speakOnTap: true,
  showWords: true,
  hidden: [],
  custom: [],
  keepRecents: true,
  recents: [],
};

export const MAX_RECENTS = 12;
export const MAX_CUSTOM_CARDS = 48;
/** Ids of custom cards start with this, so they never clash with the library. */
export const CUSTOM_PREFIX = 'mine.';

/** Moves a card to the front of the recent list. */
export function withRecent(recents: string[], id: string): string[] {
  return [id, ...recents.filter((x) => x !== id)].slice(0, MAX_RECENTS);
}

/** A card on the board: from the library, or one of the child's own. */
export type BoardCard = TalkCard & { photo?: string };

/** Finds a card by id among the child's own cards and the library. */
export function resolveCard(id: string, custom: TalkCustomCard[]): BoardCard | undefined {
  return custom.find((c) => c.id === id) ?? talkCardById(id);
}

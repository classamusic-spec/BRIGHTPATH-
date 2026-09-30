import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MyToolsButton } from '@/components/kid/MyTools';
import { MessageBar, type MessageItem } from '@/components/talk/MessageBar';
import { QuickTalk } from '@/components/talk/QuickTalk';
import { TalkCardTile } from '@/components/talk/TalkCardTile';
import { TalkPicture } from '@/components/talk/TalkPicture';
import { Header, Screen, Tap, Txt } from '@/components/ui';
import { TALK_CATEGORIES } from '@/content/talk';
import type { SymbolId } from '@/content/talkSymbols';
import { useMotionLevel } from '@/lib/motion';
import { sayAloud, stopSpeaking } from '@/lib/speech';
import { useApp, useLearner, useTalkPrefs } from '@/store';
import { resolveCard, type BoardCard } from '@/store/talk';
import { colors, fonts, GUTTER, radius, shadows } from '@/theme';

type Section = { id: string; label: string; symbol: SymbolId; cards: BoardCard[] };
type Tab = { id: string; label: string; symbol: SymbolId; sections: Section[] };

const [CORE, ...TOPICS] = TALK_CATEGORIES;
const RECENT = 'recent';
const MINE = 'mine';
/** Enough for a long sentence; older words fall off the front. */
const MAX_MESSAGE = 24;
/** Cards never grow wider than this; wide screens get more columns instead. */
const MAX_CARD = 150;

/**
 * Talk — an always-available picture board (AAC) for children who speak
 * little or not at all. Quick needs, fixed Core words, and topic categories
 * with subcategories; tapping a card says it and adds it to the message.
 * What a child says here is their voice: it is never scored or recorded as evidence.
 */
export default function Talk() {
  const learner = useLearner();
  const prefs = useTalkPrefs(learner.id);
  const noteUse = useApp((s) => s.noteTalkUse);
  const level = useMotionLevel();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [message, setMessage] = useState<MessageItem[]>([]);
  const [tabId, setTabId] = useState(CORE.id);
  const [sectionByTab, setSectionByTab] = useState<Record<string, string>>({});
  // Recent cards stay put while the child is using them; the list refreshes when a tab is chosen.
  const [recentIds, setRecentIds] = useState(prefs.recents);
  const seq = useRef(0);
  const tabScroller = useRef<ScrollView>(null);
  const tabX = useRef<Record<string, number>>({});

  const tabs = useMemo<Tab[]>(() => {
    const list: Tab[] = [{ id: CORE.id, label: CORE.label, symbol: CORE.symbol, sections: CORE.subcategories }];
    if (prefs.keepRecents) {
      const cards = recentIds.map((id) => resolveCard(id, prefs.custom)).filter((c): c is BoardCard => !!c);
      list.push({ id: RECENT, label: 'Recent', symbol: 'mantelpiece-clock', sections: [{ id: RECENT, label: 'Recent', symbol: 'mantelpiece-clock', cards }] });
    }
    if (prefs.custom.length) {
      list.push({ id: MINE, label: 'My words', symbol: 'sparkling-heart', sections: [{ id: MINE, label: 'My words', symbol: 'sparkling-heart', cards: prefs.custom }] });
    }
    for (const c of TOPICS) if (!prefs.hidden.includes(c.id)) list.push({ id: c.id, label: c.label, symbol: c.symbol, sections: c.subcategories });
    return list;
  }, [prefs.keepRecents, prefs.custom, prefs.hidden, recentIds]);

  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
  const section = tab.sections.find((s) => s.id === sectionByTab[tab.id]) ?? tab.sections[0];

  const selectTab = (id: string) => {
    setTabId(id);
    setRecentIds(useApp.getState().talk[learner.id]?.recents ?? []);
    const x = tabX.current[id];
    if (x !== undefined) tabScroller.current?.scrollTo({ x: Math.max(0, x - 48), animated: level !== 'off' });
  };

  const { speakOnTap } = prefs;
  const onCard = useCallback(
    (card: BoardCard) => {
      if (speakOnTap) sayAloud(card.say);
      const key = `${card.id}#${++seq.current}`;
      setMessage((m) => [...m, { key, card }].slice(-MAX_MESSAGE));
      noteUse(learner.id, card.id);
    },
    [speakOnTap, noteUse, learner.id],
  );

  // Columns: the grown-up's choice on a phone, more on wider screens so cards stay a comfortable size.
  const avail = width - 2 * GUTTER;
  const gap = prefs.columns >= 5 ? 6 : prefs.columns === 3 ? 10 : 8;
  const cols = Math.max(prefs.columns, Math.floor((avail + gap) / (MAX_CARD + gap)));
  const cardW = Math.floor((avail - gap * (cols - 1)) / cols);
  const hint = speakOnTap ? 'Says it and adds it to your message' : 'Adds it to your message';

  return (
    <Screen
      scroll={false}
      padded={false}
      edges={['top']}
      header={<Header title="Talk" right={<MyToolsButton />} style={{ paddingBottom: 4 }} />}
    >
      <View style={{ paddingHorizontal: GUTTER, paddingBottom: 6 }}>
        <MessageBar
          items={message}
          onSpeak={() => sayAloud(message.map((m) => m.card.say).join(' '))}
          onBackspace={() => setMessage((m) => m.slice(0, -1))}
          onClear={() => {
            stopSpeaking();
            setMessage([]);
          }}
        />
      </View>

      <QuickTalk />

      <ScrollView
        ref={tabScroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsRow}
        contentContainerStyle={styles.tabs}
        accessibilityRole="tablist"
      >
        {tabs.map((t) => {
          const on = t.id === tab.id;
          return (
            <View key={t.id} onLayout={(e) => (tabX.current[t.id] = e.nativeEvent.layout.x)}>
              <Tap
                onPress={() => selectTab(t.id)}
                style={[styles.tab, on ? styles.tabOn : null]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
                scale={0.94}
              >
                <TalkPicture symbol={t.symbol} size={28} />
                <Txt v="label" color={on ? colors.ink : colors.text} style={styles.tabText}>
                  {t.label}
                </Txt>
              </Tap>
            </View>
          );
        })}
      </ScrollView>

      {tab.sections.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionsRow} contentContainerStyle={styles.sections} accessibilityRole="tablist">
          {tab.sections.map((s) => {
            const on = s.id === section.id;
            return (
              <Tap
                key={s.id}
                onPress={() => setSectionByTab((m) => ({ ...m, [tab.id]: s.id }))}
                style={[styles.section, on ? styles.sectionOn : null]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={s.label}
                scale={0.95}
              >
                <TalkPicture symbol={s.symbol} size={22} />
                <Txt v="label" color={on ? colors.onPrimary : colors.text} style={styles.sectionText}>
                  {s.label}
                </Txt>
              </Tap>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        key={`${tab.id}/${section.id}`}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.grid, { gap, paddingBottom: Math.max(insets.bottom, 12) + 16 }]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={`${section.label} words`}
      >
        {section.cards.length ? (
          section.cards.map((c) => <TalkCardTile key={c.id} card={c} width={cardW} showWords={prefs.showWords} onPress={onCard} hint={hint} />)
        ) : (
          <View style={styles.empty}>
            <TalkPicture symbol={section.symbol} size={64} />
            <Txt v="bodyLg" color={colors.textSoft} center style={{ marginTop: 8 }}>
              Words you use will show up here.
            </Txt>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsRow: { flexGrow: 0, marginTop: 4 },
  tabs: { gap: 8, paddingHorizontal: GUTTER, paddingVertical: 6 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 2.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  tabOn: { backgroundColor: '#FFFFFF', borderColor: colors.primary, ...shadows.soft },
  tabText: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20 },
  sectionsRow: { flexGrow: 0 },
  sections: { gap: 8, paddingHorizontal: GUTTER, paddingTop: 2, paddingBottom: 8 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  sectionOn: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryPressed },
  sectionText: { fontFamily: fonts.extrabold, fontSize: 14.5, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: GUTTER, paddingTop: 4 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 36, paddingHorizontal: 24 },
});

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { withRouteLearner } from '@/components/coach/Kit';
import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { Icon } from '@/components/icons/Icon';
import { TalkCardTile } from '@/components/talk/TalkCardTile';
import { TalkPicture } from '@/components/talk/TalkPicture';
import { Button, Card, Header, Screen, Sheet, Tap, Toggle, Txt } from '@/components/ui';
import { ALL_TALK_CARDS, QUICK_CARDS, TALK_CATEGORIES, WORD_CLASS_COLORS, type WordClass } from '@/content/talk';
import { TALK_SYMBOLS, type SymbolId } from '@/content/talkSymbols';
import type { Learner } from '@/engine/types';
import { CameraDeniedError, pickTalkPhoto } from '@/lib/talkPhoto';
import { useApp, useTalkPrefs } from '@/store';
import { MAX_CUSTOM_CARDS, type TalkCustomCard, type TalkPrefs } from '@/store/talk';
import { colors, radius } from '@/theme';

const TOPICS = TALK_CATEGORIES.slice(1);
const SUBCATEGORY_COUNT = TALK_CATEGORIES.reduce((n, c) => n + c.subcategories.length, 0);

/** Every library picture with the words that describe it, for the picture search. */
const PICTURES: { symbol: SymbolId; words: string }[] = (() => {
  const words = new Map<SymbolId, Set<string>>();
  const add = (symbol: SymbolId, w: string) => {
    const set = words.get(symbol) ?? new Set<string>();
    set.add(w.toLowerCase());
    words.set(symbol, set);
  };
  for (const c of ALL_TALK_CARDS) add(c.symbol, c.label);
  for (const s of Object.keys(TALK_SYMBOLS) as SymbolId[]) add(s, s.replace(/-/g, ' '));
  return [...words].map(([symbol, w]) => ({ symbol, words: [...w].join(' · ') }));
})();

/** Shown before anything is typed: people, pets and toys are what families add most. */
const STARTER_PICTURES: SymbolId[] = [
  ...new Set(
    TALK_CATEGORIES.flatMap((c) => c.subcategories)
      .filter((s) => ['family', 'pets', 'toys'].includes(s.id))
      .flatMap((s) => s.cards.map((c) => c.symbol)),
  ),
].slice(0, 24);

function findPictures(query: string): SymbolId[] {
  const q = query.trim().toLowerCase();
  if (!q) return STARTER_PICTURES;
  return PICTURES.filter((p) => p.words.includes(q))
    .slice(0, 30)
    .map((p) => p.symbol);
}

type Draft = Omit<TalkCustomCard, 'id'> & { id?: string };
const NEW_CARD: Draft = { label: '', say: '', cls: 'thing', symbol: 'sparkling-heart' };

/** Talk board settings for one learner: layout, voice, topics, recent words and their own words and photos. */
export default withRouteLearner(TalkSettings);

function TalkSettings({ learner }: { learner: Learner }) {
  const prefs = useTalkPrefs(learner.id);
  const updateTalk = useApp((s) => s.updateTalk);
  const clearRecents = useApp((s) => s.clearTalkRecents);
  const [draft, setDraft] = useState<Draft | null>(null);
  const set = (patch: Partial<Omit<TalkPrefs, 'custom' | 'recents'>>) => updateTalk(learner.id, patch);
  const name = learner.displayName;

  return (
    <Screen header={<Header title="Talk Board" />}>
      <Card style={styles.intro}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TalkPicture symbol="speech-balloon" size={56} />
          <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 17, lineHeight: 24 }}>
            {`${name}’s picture board for saying things out loud: ${ALL_TALK_CARDS.length} picture cards — ${QUICK_CARDS.length} quick words plus ${TALK_CATEGORIES.length} categories with ${SUBCATEGORY_COUNT} subcategories.`}
          </Txt>
        </View>
        <Txt v="body" color={colors.textSoft} style={{ marginTop: 10 }}>
          {`${name} can open it from the Talk button on the map, or from My Tools on any screen. What ${name} says there is their own voice: it is never scored or saved as evidence.`}
        </Txt>
      </Card>

      <SectionTitle>Cards per row</SectionTitle>
      <ChoiceChips
        options={[
          { key: '3', label: '3 · Biggest' },
          { key: '4', label: '4 · Standard' },
          { key: '5', label: '5 · More words' },
        ]}
        value={String(prefs.columns)}
        onChange={(v) => set({ columns: Number(v) as TalkPrefs['columns'] })}
      />

      <SectionTitle>Voice and words</SectionTitle>
      <Card style={styles.rows}>
        <Row label="Say each word when tapped" sub="The whole message can always be spoken" value={prefs.speakOnTap} onChange={(v) => set({ speakOnTap: v })} />
        <Row label="Show words under pictures" value={prefs.showWords} onChange={(v) => set({ showWords: v })} />
        <Row label="Keep recent words" sub="On this device only" value={prefs.keepRecents} onChange={(v) => set({ keepRecents: v })} />
      </Card>
      {prefs.recents.length ? (
        <Button kind="soft" size="sm" title="Clear recent words" onPress={() => clearRecents(learner.id)} style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 18 }} />
      ) : null}

      <SectionTitle>{`${name}’s own words`}</SectionTitle>
      <Txt v="bodySm" color={colors.textMuted} style={{ marginTop: -4, marginBottom: 10 }}>
        People, pets, favourite things and places — with a picture or your own photo. They show first, under “My words”.
      </Txt>
      <View style={styles.mine}>
        {prefs.custom.map((c) => (
          <View key={c.id} style={{ alignItems: 'center', gap: 4 }}>
            <TalkCardTile card={c} width={92} showWords onPress={() => setDraft({ ...c })} hint="Edit this card" />
          </View>
        ))}
        {prefs.custom.length < MAX_CUSTOM_CARDS ? (
          <Tap onPress={() => setDraft({ ...NEW_CARD })} style={styles.add} accessibilityLabel="Add a word">
            <Icon name="plus" size={34} color={colors.cobalt} />
            <Txt v="label" color={colors.cobalt} center>
              Add a word
            </Txt>
          </Tap>
        ) : null}
      </View>

      <SectionTitle>Topics on the board</SectionTitle>
      <Txt v="bodySm" color={colors.textMuted} style={{ marginTop: -4, marginBottom: 10 }}>
        Put topics away to keep the board simple. Core words and the quick words (yes, no, help, bathroom…) always stay.
      </Txt>
      <Card style={styles.rows}>
        {TOPICS.map((c) => {
          const on = !prefs.hidden.includes(c.id);
          const words = c.subcategories.reduce((n, s) => n + s.cards.length, 0);
          return (
            <View key={c.id} style={styles.topic}>
              <TalkPicture symbol={c.symbol} size={36} />
              <View style={{ flex: 1 }}>
                <Txt v="label" color={colors.ink}>
                  {c.label}
                </Txt>
                <Txt v="caption" color={colors.textMuted} numberOfLines={2}>
                  {`${words} words · ${c.subcategories.map((s) => s.label).join(', ')}`}
                </Txt>
              </View>
              <Toggle value={on} label={`Show ${c.label}`} onChange={(v) => set({ hidden: v ? prefs.hidden.filter((h) => h !== c.id) : [...prefs.hidden, c.id] })} />
            </View>
          );
        })}
      </Card>

      <Txt v="caption" color={colors.textMuted} style={{ marginTop: 16 }}>
        Pictures: Fluent Emoji by Microsoft (MIT License). The voice is the device’s own text-to-speech.
      </Txt>

      <CardEditor learnerId={learner.id} draft={draft} onChange={setDraft} onClose={() => setDraft(null)} />
    </Screen>
  );
}

function Row({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Txt v="label" color={colors.ink}>
          {label}
        </Txt>
        {sub ? (
          <Txt v="caption" color={colors.textMuted}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

const CLASS_OPTIONS = (Object.keys(WORD_CLASS_COLORS) as WordClass[]).map((k) => ({ key: k, label: WORD_CLASS_COLORS[k].label }));

/** Add or edit one of the child's own cards: words, voice, colour, and a library picture or a photo. */
function CardEditor({ learnerId, draft, onChange, onClose }: { learnerId: string; draft: Draft | null; onChange: (d: Draft) => void; onClose: () => void }) {
  const consentPhotos = useApp((s) => s.consent.photos);
  const addCard = useApp((s) => s.addTalkCard);
  const updateCard = useApp((s) => s.updateTalkCard);
  const removeCard = useApp((s) => s.removeTalkCard);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const d = draft ?? NEW_CARD;
  const { id } = d;
  const edit = (patch: Partial<Draft>) => onChange({ ...d, ...patch });
  const label = d.label.trim();

  const close = () => {
    setQuery('');
    setError(null);
    onClose();
  };
  const save = () => {
    if (!label) return;
    const card = { label, say: d.say.trim() || label, cls: d.cls, symbol: d.symbol, ...(d.photo ? { photo: d.photo } : null) };
    if (id) updateCard(learnerId, id, { ...card, photo: d.photo });
    else if (!addCard(learnerId, card)) {
      setError(`The board already has ${MAX_CUSTOM_CARDS} of your own cards. Remove one to add another.`);
      return;
    }
    close();
  };
  const photo = async (camera: boolean) => {
    setError(null);
    setBusy(true);
    try {
      const uri = await pickTalkPhoto(camera);
      if (uri) edit({ photo: uri });
    } catch (e) {
      setError(e instanceof CameraDeniedError ? 'Camera access is off. You can choose a photo from the library instead.' : 'Couldn’t add that photo. Please try another one.');
    } finally {
      setBusy(false);
    }
  };
  // Pictures matching the search, else the card's words, else the starter set; the chosen one always shows.
  const suggested = label ? findPictures(label) : [];
  const found = query.trim() ? findPictures(query) : suggested.length ? suggested : STARTER_PICTURES;
  const pictures = found.includes(d.symbol) || query.trim() ? found : [d.symbol, ...found];

  return (
    <Sheet visible={!!draft} onClose={close} title={id ? 'Edit card' : 'Add a word'} maxHeight={0.92}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <TalkCardTile card={{ id: id ?? 'draft', label: label || 'Your word', say: d.say, cls: d.cls, symbol: d.symbol, photo: d.photo }} width={112} showWords />
      </View>
      <TextField label="Word or phrase on the card" value={d.label} onChangeText={(t) => edit({ label: t })} maxLength={28} placeholder="e.g. Grandma, my red bike" />
      <TextField label="What the voice says (optional)" value={d.say} onChangeText={(t) => edit({ say: t })} maxLength={80} placeholder={label ? `“${label}”` : 'Same as the card'} />

      <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
        Colour (word type)
      </Txt>
      <ChoiceChips options={CLASS_OPTIONS} value={d.cls} onChange={(v) => edit({ cls: v as WordClass })} />

      <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
        Photo
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Button kind="white" size="sm" title="Take a photo" disabled={!consentPhotos || busy} onPress={() => void photo(true)} icon={<Icon name="camera" size={22} />} style={styles.photoBtn} />
        <Button kind="white" size="sm" title="Choose a photo" disabled={!consentPhotos || busy} onPress={() => void photo(false)} icon={<Icon name="plus" size={20} color={colors.cobalt} />} style={styles.photoBtn} />
        {d.photo ? <Button kind="ghost" size="sm" title="Use a picture instead" onPress={() => edit({ photo: undefined })} style={styles.photoBtn} /> : null}
      </View>
      <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6, marginBottom: 12 }}>
        {consentPhotos ? 'Photos are made small and stay on this device.' : 'Photos are turned off in Privacy & Data. You can still pick a picture below.'}
      </Txt>

      {!d.photo ? (
        <>
          <TextField label="Picture" value={query} onChangeText={setQuery} placeholder="Find a picture (dog, park, cake…)" />
          <View style={styles.pictures}>
            {pictures.length ? (
              pictures.map((s) => {
                const on = s === d.symbol;
                return (
                  <Tap
                    key={s}
                    onPress={() => edit({ symbol: s })}
                    style={[styles.picture, on ? styles.pictureOn : null]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, checked: on }}
                    accessibilityLabel={s.replace(/-/g, ' ')}
                    scale={0.9}
                  >
                    <TalkPicture symbol={s} size={40} />
                  </Tap>
                );
              })
            ) : (
              <Txt v="bodySm" color={colors.textMuted}>
                No pictures match that yet — try another word.
              </Txt>
            )}
          </View>
        </>
      ) : null}

      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <Txt v="bodySm" color={colors.dangerText}>
            {error}
          </Txt>
        </View>
      ) : null}

      <Button title={id ? 'Save card' : 'Add to the board'} disabled={!label || busy} onPress={save} style={{ marginTop: 14 }} />
      {id ? (
        <Button
          kind="danger"
          size="md"
          title="Remove this card"
          onPress={() => {
            removeCard(learnerId, id);
            close();
          }}
          style={{ marginTop: 10 }}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  intro: { padding: 16 },
  rows: { paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  topic: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  mine: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  add: {
    width: 92,
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryTint,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 6,
  },
  photoBtn: { paddingHorizontal: 14 },
  pictures: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  picture: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  pictureOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  error: { marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.blushSoft },
});

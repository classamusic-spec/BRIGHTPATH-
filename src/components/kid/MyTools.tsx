import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { Sheet, Tap, Txt } from '@/components/ui';
import type { AgencyTool } from '@/engine/types';
import { successHaptic } from '@/lib/feedback';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';
import { colors, radius, shadows, tones, type Tone } from '@/theme';

const TOOLS: { key: AgencyTool; label: string; sub: string; icon: IconName; tone: Tone }[] = [
  { key: 'break', label: 'Break', sub: 'Go to Calm Space', icon: 'sprout', tone: 'mint' },
  { key: 'help', label: 'Help', sub: 'Show me a hint', icon: 'hand', tone: 'orange' },
  { key: 'moreTime', label: 'More Time', sub: 'No rush at all', icon: 'clock', tone: 'lavender' },
  { key: 'quiet', label: 'Quiet Please', sub: 'Softer sounds', icon: 'moon', tone: 'sky' },
  { key: 'notYet', label: 'Not Yet', sub: 'Try it later', icon: 'star', tone: 'butter' },
  { key: 'myChoice', label: 'My Choice', sub: 'Pick another quest', icon: 'heart', tone: 'blush' },
  { key: 'stop', label: 'All Done', sub: 'Stop for now', icon: 'house', tone: 'blue' },
];

/**
 * My Tools — Break, Help, More Time, Stop, Not Yet, Quiet Please, My Choice.
 * Always available, never earned or removed (Framework §2.2).
 */
export function MyToolsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const quiet = useApp((s) => s.session.quiet);
  const setQuiet = useApp((s) => s.setQuiet);
  const earnStars = useApp((s) => s.earnStars);
  const mission = useMission();
  const [note, setNote] = useState<string | null>(null);

  const use = (t: AgencyTool) => {
    successHaptic();
    mission.useTool(t);
    if (mission.runId && !mission.toolStarGiven) {
      earnStars(1, 'Used a My Tools card');
      mission.markToolStar();
    }
    switch (t) {
      case 'break':
        onClose();
        router.push('/kid/calm');
        break;
      case 'help':
        mission.requestHelp();
        speak('Here is a hint. Look for the glowing choice!', { force: true });
        onClose();
        break;
      case 'moreTime':
        setNote('Take all the time you need. Nothing is timed here.');
        speak('Take all the time you need.');
        break;
      case 'quiet':
        setQuiet(!quiet);
        setNote(!quiet ? 'Quiet mode is on: softer sounds and gentler motion.' : 'Quiet mode is off.');
        break;
      case 'notYet':
        onClose();
        router.dismissTo('/kid/home');
        break;
      case 'myChoice':
        onClose();
        router.push('/kid/quests');
        break;
      case 'stop':
        onClose();
        router.replace('/kid/done');
        break;
    }
  };

  return (
    <Sheet visible={visible} onClose={() => { setNote(null); onClose(); }} title="My Tools" subtitle="You can use these any time.">
      <View style={styles.grid}>
        {TOOLS.map((t) => {
          const on = t.key === 'quiet' && quiet;
          return (
            <Tap key={t.key} onPress={() => use(t.key)} style={[styles.tool, { backgroundColor: tones[t.tone].bg }, on ? { borderColor: tones[t.tone].deep } : null]} accessibilityLabel={`${t.label}. ${t.sub}`} accessibilityState={{ selected: on }} scale={0.94}>
              <Icon name={t.icon} size={40} />
              <Txt v="subheading" color={colors.ink} style={{ marginTop: 6, fontSize: 17 }} center>
                {t.label}
              </Txt>
              <Txt v="caption" color={colors.textSoft} center>
                {t.sub}
              </Txt>
            </Tap>
          );
        })}
      </View>
      {note ? (
        <View style={styles.note}>
          <Txt v="body" color={colors.text} center>
            {note}
          </Txt>
        </View>
      ) : null}
    </Sheet>
  );
}

export function MyToolsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tap onPress={() => setOpen(true)} style={styles.btn} accessibilityLabel="My Tools: break, help, more time, stop" hitSlop={8}>
        <Icon name="hand" size={30} />
      </Tap>
      <MyToolsSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  btn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tool: { width: '31.5%', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderWidth: 2.5, borderColor: 'transparent' },
  note: { marginTop: 14, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14 },
});

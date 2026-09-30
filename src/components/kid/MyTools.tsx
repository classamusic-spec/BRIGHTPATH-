import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { Button, Sheet, Tap, Txt } from '@/components/ui';
import { GUIDE } from '@/content/cast';
import type { AgencyTool } from '@/engine/types';
import { announce } from '@/lib/announce';
import { successHaptic } from '@/lib/feedback';
import { speak } from '@/lib/speech';
import { useApp } from '@/store';
import { useMission } from '@/store/mission';
import { colors, radius, shadows, tones, type Tone } from '@/theme';

const TOOLS: { key: AgencyTool; label: string; sub: string; icon: IconName; tone: Tone }[] = [
  { key: 'break', label: 'Break', sub: 'Calm Space', icon: 'sprout', tone: 'mint' },
  { key: 'help', label: 'Help', sub: 'Show me a hint', icon: 'chat', tone: 'orange' },
  { key: 'moreTime', label: 'More Time', sub: 'No rush at all', icon: 'clock', tone: 'lavender' },
  { key: 'quiet', label: 'Quiet Please', sub: 'Softer sounds', icon: 'moon', tone: 'sky' },
  { key: 'notYet', label: 'Not Yet', sub: 'Try it later', icon: 'star', tone: 'butter' },
  { key: 'myChoice', label: 'My Choice', sub: 'Pick another quest', icon: 'heart', tone: 'blush' },
];

/**
 * My Tools — Break, Help, More Time, Stop, Not Yet, Quiet Please, My Choice.
 * Always available, never earned or removed (Framework §2.2).
 */
export function MyToolsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const quiet = useApp((s) => s.session.quiet);
  const setQuiet = useApp((s) => s.setQuiet);
  const earnStars = useApp((s) => s.earnStars);
  const mission = useMission();
  const [note, setNote] = useState<string | null>(null);

  const tell = (msg: string) => {
    setNote(msg);
    announce(msg);
  };
  // Leaving the quest early is a choice, never a failure: the run is only marked as set aside.
  const leaveRun = () => {
    const runId = useMission.getState().runId;
    if (runId) useApp.getState().abandonRun(runId);
    useMission.getState().end();
  };
  const close = () => {
    setNote(null);
    onClose();
  };

  const use = (t: AgencyTool) => {
    successHaptic();
    const inRun = !!mission.runId;
    mission.useTool(t);
    if (inRun && !mission.toolStarGiven) {
      earnStars(1, 'Used a My Tools card');
      mission.markToolStar();
    }
    switch (t) {
      case 'break':
        close();
        if (pathname !== '/kid/calm') router.push(inRun ? { pathname: '/kid/calm', params: { from: 'mission' } } : '/kid/calm');
        break;
      case 'help': {
        if (!inRun) {
          tell('You can ask a grown-up for help any time.');
          speak('You can ask a grown-up for help any time.', { force: true });
          break;
        }
        mission.requestHelp();
        const msg = useMission.getState().hasOptions ? 'Here is a hint. Look for the glowing choice!' : `Here is a hint. ${GUIDE.name} will show you how.`;
        speak(msg, { force: true });
        announce(msg);
        close();
        break;
      }
      case 'moreTime':
        tell('Take all the time you need. Nothing is timed here.');
        speak('Take all the time you need.');
        break;
      case 'quiet':
        setQuiet(!quiet);
        tell(!quiet ? 'Quiet mode is on: softer sounds and gentler motion.' : 'Quiet mode is off.');
        break;
      case 'notYet':
        if (!inRun) {
          tell('That’s okay. Nothing has to happen right now.');
          if (pathname !== '/kid/home') {
            onClose();
            router.dismissTo('/kid/home');
          }
          break;
        }
        leaveRun();
        announce('Okay, we can try it later.');
        close();
        router.dismissTo('/kid/home');
        break;
      case 'myChoice':
        leaveRun();
        close();
        if (pathname !== '/kid/quests') router.push('/kid/quests');
        break;
      case 'stop':
        leaveRun();
        close();
        router.replace(inRun ? '/kid/done' : { pathname: '/kid/done', params: { from: 'tools' } });
        break;
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title="My Tools" subtitle="You can use these any time.">
      <View style={styles.grid}>
        {TOOLS.map((t) => {
          const isQuiet = t.key === 'quiet';
          const on = isQuiet && quiet;
          return (
            <Tap
              key={t.key}
              onPress={() => use(t.key)}
              style={[styles.tool, { backgroundColor: tones[t.tone].bg }, on ? { borderColor: tones[t.tone].deep } : null]}
              accessibilityLabel={`${t.label}. ${t.sub}`}
              accessibilityRole={isQuiet ? 'switch' : 'button'}
              accessibilityState={isQuiet ? { checked: quiet } : undefined}
              scale={0.94}
            >
              <Icon name={t.icon} size={40} />
              <Txt v="subheading" color={colors.ink} style={{ marginTop: 6, fontSize: 17 }} center numberOfLines={1} adjustsFontSizeToFit>
                {t.label}
              </Txt>
              <Txt v="caption" color={colors.textSoft} center numberOfLines={2}>
                {t.sub}
              </Txt>
            </Tap>
          );
        })}
      </View>
      <Button kind="soft" title="All Done" accessibilityHint="Stop for now" icon={<Icon name="house" size={28} />} onPress={() => use('stop')} style={{ marginTop: 12 }} />
      {note ? (
        <View style={styles.note} accessibilityLiveRegion="polite">
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
      <Tap onPress={() => setOpen(true)} style={styles.btn} accessibilityLabel="My Tools: break, help, more time, stop, quiet, not yet, my choice" hitSlop={8}>
        <Icon name="hand" size={30} />
      </Tap>
      <MyToolsSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  btn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tool: { width: '31.5%', minHeight: 118, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6, borderWidth: 2.5, borderColor: 'transparent' },
  note: { marginTop: 14, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14 },
});

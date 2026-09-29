import { useState } from 'react';
import { View } from 'react-native';

import { ChoiceChips } from '@/components/coach/Form';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Appear, Card, Header, ListRow, Screen, Sheet, Toggle, Txt } from '@/components/ui';
import type { NotificationPrefs } from '@/engine/types';
import { useApp } from '@/store';
import { colors, radius } from '@/theme';

const TIMES = ['07:00', '08:00', '12:00', '15:30', '16:30', '18:00', '19:30', '21:00'];

function label12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** 39 · Notifications / Schedule — gentle, respectful nudges only. */
export default function Notifications() {
  const prefs = useApp((s) => s.notifications);
  const set = useApp((s) => s.setNotifications);
  const [sheet, setSheet] = useState<'quiet' | 'schedule' | null>(null);
  const toggles: { key: keyof Pick<NotificationPrefs, 'goalReminders' | 'dailyCheckIn' | 'progressUpdates' | 'coachMessages'>; icon: IconName; title: string; sub: string }[] = [
    { key: 'goalReminders', icon: 'bell', title: 'Goal Reminders', sub: 'Gentle nudges' },
    { key: 'dailyCheckIn', icon: 'sun', title: 'Daily Check-In', sub: 'A moment to reflect' },
    { key: 'progressUpdates', icon: 'bars', title: 'Progress Updates', sub: 'Weekly summary' },
    { key: 'coachMessages', icon: 'chatBlue', title: 'Coach Messages', sub: 'Tips and encouragement' },
  ];
  return (
    <Screen header={<Header title="Notifications / Schedule" />}>
      <Card style={{ overflow: 'hidden' }}>
        {toggles.map((t, i) => (
          <Appear key={t.key} delay={i * 50} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.lineSoft } : null}>
            <ListRow icon={t.icon} plainIcon tileSize={58} titleSize={19.5} title={t.title} subtitle={t.sub} right={<Toggle value={prefs[t.key]} onChange={(v) => set({ [t.key]: v })} label={t.title} />} style={{ paddingVertical: 14 }} />
          </Appear>
        ))}
      </Card>
      <Card style={{ marginTop: 12 }}>
        <ListRow icon="moon" plainIcon tileSize={58} titleSize={19.5} title="Quiet Hours" subtitle={`${label12(prefs.quietHours.start)} — ${label12(prefs.quietHours.end)}`} onPress={() => setSheet('quiet')} />
      </Card>
      <Card style={{ marginTop: 12 }}>
        <ListRow icon="clockOutline" plainIcon tileSize={58} titleSize={19.5} title="Reminder Schedule" subtitle="Set times that work for you" onPress={() => setSheet('schedule')} />
      </Card>
      <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: radius.lg }}>
        <Icon name="heart" size={70} />
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 18 }}>
          Support at the right time makes all the difference.
        </Txt>
      </Card>
      <Txt v="caption" color={colors.textMuted} style={{ marginTop: 10 }}>
        Reminders never create streaks or pressure, and children never receive notifications.
      </Txt>

      <Sheet visible={sheet === 'quiet'} onClose={() => setSheet(null)} title="Quiet Hours" subtitle="No notifications between these times.">
        <Txt v="label" style={{ marginBottom: 6 }}>
          Start
        </Txt>
        <ChoiceChips options={['19:30', '20:00', '21:00', '22:00'].map((t) => ({ key: t, label: label12(t) }))} value={prefs.quietHours.start} onChange={(v) => set({ quietHours: { ...prefs.quietHours, start: v as string } })} />
        <Txt v="label" style={{ marginBottom: 6 }}>
          End
        </Txt>
        <ChoiceChips options={['06:00', '07:00', '08:00'].map((t) => ({ key: t, label: label12(t) }))} value={prefs.quietHours.end} onChange={(v) => set({ quietHours: { ...prefs.quietHours, end: v as string } })} />
      </Sheet>
      <Sheet visible={sheet === 'schedule'} onClose={() => setSheet(null)} title="Reminder Schedule" subtitle="Pick the times that fit your family’s routine.">
        <ChoiceChips multi options={TIMES.map((t) => ({ key: t, label: label12(t) }))} value={prefs.reminderTimes} onChange={(v) => set({ reminderTimes: v as string[] })} />
        <View style={{ height: 8 }} />
      </Sheet>
    </Screen>
  );
}

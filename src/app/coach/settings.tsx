import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CoachNav } from '@/components/coach/Kit';
import { TextField } from '@/components/coach/Form';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Card, Header, ListRow, Screen, Sheet, Txt } from '@/components/ui';
import { selectLearner, useApp } from '@/store';
import { colors, radius } from '@/theme';

/** 38 · Settings / Accessibility */
export default function Settings() {
  const learner = useApp(selectLearner);
  const adultName = useApp((s) => s.adultName);
  const setAdultName = useApp((s) => s.setAdultName);
  const [sheet, setSheet] = useState<'account' | 'appearance' | 'language' | 'help' | null>(null);
  const [name, setName] = useState(adultName);
  const go = (path: string) => () => router.push({ pathname: path as never, params: { id: learner.id } } as never);
  const rows = [
    { icon: 'person' as const, title: 'Child Profile', onPress: go('/coach/learner/[id]/child') },
    { icon: 'gear' as const, title: 'Account Settings', onPress: () => setSheet('account') },
    { icon: 'accessibility' as const, title: 'Accessibility', onPress: () => router.push({ pathname: '/coach/learner/[id]/child', params: { id: learner.id, section: 'access' } }) },
    { icon: 'sun' as const, title: 'Appearance', value: 'Light', onPress: () => setSheet('appearance'), noChevron: true },
    { icon: 'globe' as const, title: 'Language', value: 'English', onPress: () => setSheet('language') },
    { icon: 'question' as const, title: 'Help & Support', onPress: () => setSheet('help') },
    { icon: 'info' as const, title: 'About BrightPath', onPress: () => router.push('/coach/about') },
  ];
  return (
    <Screen header={<Header title="Settings / Accessibility" back={false} />} footer={<CoachNav active="more" />}>
      <View style={{ gap: 10 }}>
        {rows.map((r, i) => (
          <Appear key={r.title} delay={i * 40}>
            <Card>
              <ListRow icon={r.icon} plainIcon tileSize={56} titleSize={19.5} title={r.title} value={r.value} onPress={r.onPress} right={'noChevron' in r ? <View /> : undefined} style={{ paddingVertical: 12 }} />
            </Card>
          </Appear>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#FDF1D2', borderRadius: radius.lg, padding: 16, marginTop: 12 }}>
        <Icon name="sun" size={66} />
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 19, lineHeight: 26 }}>
          {'Built for every child.\nA more inclusive tomorrow.'}
        </Txt>
      </View>
      <Txt v="label" color={colors.textMuted} style={{ marginTop: 18, marginBottom: 8, marginLeft: 4 }}>
        MORE
      </Txt>
      <View style={{ gap: 10 }}>
        <Card>
          <ListRow icon="bell" plainIcon tileSize={56} titleSize={19.5} title="Notifications / Schedule" onPress={() => router.push('/coach/notifications')} style={{ paddingVertical: 12 }} />
        </Card>
        <Card>
          <ListRow icon="shield" plainIcon tileSize={56} titleSize={19.5} title="Data & Privacy" onPress={() => router.push('/coach/privacy')} style={{ paddingVertical: 12 }} />
        </Card>
        <Card>
          <ListRow icon="star" plainIcon tileSize={56} titleSize={19.5} title="Back to kid mode" subtitle={`Hand the device to ${learner.displayName}`} onPress={() => router.replace('/kid/home')} style={{ paddingVertical: 12 }} />
        </Card>
      </View>

      <Sheet visible={sheet === 'account'} onClose={() => setSheet(null)} title="Account">
        <TextField label="Your name (shown in greetings)" value={name} onChangeText={setName} />
        <Button title="Save" onPress={() => { setAdultName(name.trim() || adultName); setSheet(null); }} />
      </Sheet>
      <Sheet visible={sheet === 'appearance'} onClose={() => setSheet(null)} title="Appearance">
        <Txt v="body">BrightPath uses one calm light theme designed for low visual load. For fewer moving parts, set Animation to Gentle or Still in Accessibility — the device’s Reduce Motion setting is always respected.</Txt>
      </Sheet>
      <Sheet visible={sheet === 'language'} onClose={() => setSheet(null)} title="Language">
        <Txt v="body">English is available now. Content is written in plain language without idioms so it can be translated and culturally reviewed before release.</Txt>
      </Sheet>
      <Sheet visible={sheet === 'help'} onClose={() => setSheet(null)} title="Help & Support">
        {[
          ['How do I get back to the grown-up area?', 'Tap the gear on the child’s Home map and enter the numbers you hear or read.'],
          ['Why does a goal say “Gather More Evidence”?', 'Recommendations stay provisional until there are at least 6 valid opportunities, ideally across two sessions.'],
          ['What does “Access Limited” mean?', 'The moment happened, but readiness or access made it hard to interpret, so it never counts as a miss.'],
          ['Is BrightPath a diagnosis or therapy?', 'No. It is an educational skill-development and learning-support tool. Talk to a qualified professional about clinical questions.'],
        ].map(([q, a]) => (
          <View key={q} style={{ marginBottom: 12 }}>
            <Txt v="label">{q}</Txt>
            <Txt v="body" color={colors.textSoft}>
              {a}
            </Txt>
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import Svg from 'react-native-svg';

import { Icon } from '@/components/icons/Icon';
import { CloudShape } from '@/components/scenery/elements';
import { Appear, Button, Card, Header, ListRow, Screen, Sheet, Toggle, Txt } from '@/components/ui';
import { useApp } from '@/store';
import { colors, radius } from '@/theme';

/** 37 · Data & Privacy — local-first, exportable, deletable (Framework §55–56). */
export default function DataPrivacy() {
  const exportData = useApp((s) => s.exportData);
  const deleteAllData = useApp((s) => s.deleteAllData);
  const seedDemo = useApp((s) => s.seedDemo);
  const consent = useApp((s) => s.consent);
  const setConsent = useApp((s) => s.setConsent);
  const demo = useApp((s) => s.demoData);
  const [sheet, setSheet] = useState<'protect' | 'choices' | 'download' | 'delete' | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const download = async () => {
    const json = exportData();
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brightpath-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Your data was downloaded as a JSON file.');
    } else {
      await Share.share({ title: 'BrightPath data export', message: json });
      setStatus('Share sheet opened with your data.');
    }
  };

  return (
    <Screen header={<Header title="Data & Privacy" />}>
      <Appear style={{ alignItems: 'center' }}>
        <View style={{ width: 280, height: 150, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={280} height={120} viewBox="-140 -60 280 120" style={{ position: 'absolute', bottom: 4 }}>
            <CloudShape x={-70} y={10} s={1.1} opacity={0.9} />
            <CloudShape x={80} y={0} s={0.9} opacity={0.9} />
          </Svg>
          <Icon name="lock" size={120} />
        </View>
        <Txt v="title" center style={{ fontSize: 30, lineHeight: 36, marginTop: 4 }}>
          {'Your Child’s Privacy\nComes First'}
        </Txt>
        <Txt v="bodyLg" center color={colors.textSoft} style={{ marginTop: 8, fontSize: 19 }}>
          {'We keep your family’s information\nsafe, secure, and in your control.'}
        </Txt>
      </Appear>
      <View style={{ gap: 10, marginTop: 18 }}>
        {(
          [
            ['shield', 'How We Protect Data', 'protect'],
            ['people', 'Your Data & Choices', 'choices'],
            ['doc', 'Download My Data', 'download'],
            ['trash', 'Delete My Data', 'delete'],
          ] as const
        ).map(([icon, title, key], i) => (
          <Appear key={key} delay={i * 60}>
            <Card onPress={() => setSheet(key)}>
              <ListRow icon={icon} plainIcon tileSize={52} title={title} onPress={() => setSheet(key)} />
            </Card>
          </Appear>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#DDF3E5', borderRadius: radius.lg, padding: 16, marginTop: 14 }}>
        <Icon name="sprout" size={64} />
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 18 }}>
          A safer, kinder internet for brighter tomorrows.
        </Txt>
      </View>
      {status ? (
        <Txt v="caption" center color={colors.mintDeep} style={{ marginTop: 10 }}>
          {status}
        </Txt>
      ) : null}

      <Sheet visible={sheet === 'protect'} onClose={() => setSheet(null)} title="How we protect data">
        {[
          'Everything is stored on this device first. Cloud sync is off unless you turn it on.',
          'We ask for a display name and age band — never a legal name, birthday, school or location.',
          'No ads, no child social network, no child chat, and no public comparison.',
          'Photos are optional, stay on device, and we recommend avoiding faces. Voice is never recorded.',
          'AI is optional and never used to diagnose, infer emotion from camera or voice, or talk to children.',
        ].map((t) => (
          <Txt key={t} v="body" style={{ marginBottom: 10 }}>{`• ${t}`}</Txt>
        ))}
      </Sheet>
      <Sheet visible={sheet === 'choices'} onClose={() => setSheet(null)} title="Your data & choices">
        {(
          [
            ['analytics', 'Anonymous usage analytics', 'Off by default'],
            ['cloudSync', 'Cloud sync', 'Share with your team across devices'],
            ['photos', 'Allow optional photos', 'Stored only on this device'],
          ] as const
        ).map(([k, label, sub]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
            <View style={{ flex: 1 }}>
              <Txt v="label">{label}</Txt>
              <Txt v="caption" color={colors.textMuted}>
                {sub}
              </Txt>
            </View>
            <Toggle value={consent[k]} onChange={(v) => setConsent({ [k]: v })} label={label} />
          </View>
        ))}
        {consent.cloudSync ? (
          <Txt v="caption" color={colors.textMuted}>
            Sync will start once a BrightPath account server is configured. Until then your data stays here.
          </Txt>
        ) : null}
      </Sheet>
      <Sheet visible={sheet === 'download'} onClose={() => setSheet(null)} title="Download my data" subtitle="A complete JSON export: learners, goals, observations (with version metadata), team and settings.">
        <Button title="Download" icon={<Icon name="download" size={22} color="#FFFFFF" />} onPress={download} />
      </Sheet>
      <Sheet visible={sheet === 'delete'} onClose={() => setSheet(null)} title="Delete my data" subtitle="This permanently removes everything stored in BrightPath on this device.">
        <Button
          kind="danger"
          title="Delete everything"
          onPress={() => {
            deleteAllData();
            setSheet(null);
            router.dismissAll();
            router.replace('/kid');
          }}
        />
        {!demo ? (
          <Button
            kind="ghost"
            title="Load demo data instead"
            onPress={() => {
              seedDemo();
              setSheet(null);
            }}
            style={{ marginTop: 8 }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}

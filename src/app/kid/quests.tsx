import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { MyToolsButton } from '@/components/kid/MyTools';
import { Appear, Card, Header, IconTile, Screen, Txt } from '@/components/ui';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import { QUESTS } from '@/content/quests';
import { speak } from '@/lib/speech';
import { colors } from '@/theme';

/** 05 · Select Quest */
export default function ChooseQuest() {
  // Opened as a Home tab (which replaced Home): the back arrow returns Home.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return (
    <Screen
      header={
        <View>
          <Header title="Choose a Quest" onBack={tab ? () => router.replace('/kid/home') : undefined} right={<MyToolsButton />} style={{ paddingBottom: 0 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}>
            <Txt v="bodyLg" color={colors.textSoft} style={{ fontSize: 18.5, lineHeight: 25, flexShrink: 1 }}>
              What would you like to work on?
            </Txt>
            <ReadAloudButton text={`Choose a quest. What would you like to work on? ${QUESTS.map((q) => `${q.title}. ${q.sub}.`).join(' ')}`} style={{ width: 40, height: 40 }} />
          </View>
        </View>
      }
    >
      <View style={{ gap: 14, paddingTop: 10 }}>
        {QUESTS.map((q, i) => (
          <Appear key={q.id} delay={70 * i}>
            <Card
              onPress={() => {
                speak(`${q.title}. ${q.sub}`);
                router.push({ pathname: '/kid/mission/[id]', params: { id: q.missionId, step: '0' } });
              }}
              accessibilityLabel={`${q.title}. ${q.sub}`}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingRight: 18 }}
            >
              <IconTile tone={q.tone} size={82} radiusPx={22}>
                <Icon name={q.icon} size={56} />
              </IconTile>
              <View style={{ flex: 1, marginLeft: 18 }}>
                <Txt v="heading" color={colors.ink} style={{ fontSize: 22 }}>
                  {q.title}
                </Txt>
                <Txt v="body" color={colors.textSoft} style={{ fontSize: 17, marginTop: 2 }}>
                  {q.sub}
                </Txt>
              </View>
              <Icon name="chevronRight" size={28} color={colors.cobalt} />
            </Card>
          </Appear>
        ))}
      </View>
    </Screen>
  );
}

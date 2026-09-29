import { View } from 'react-native';

import { Wordmark } from '@/components/kid/Brand';
import { Card, Header, Screen, Txt } from '@/components/ui';
import { REVIEW_STAGES, checkAll } from '@/content/governance';
import { MISSIONS } from '@/content/missions';
import { VERSIONS } from '@/engine/types';
import { colors } from '@/theme';

/** About BrightPath — versions, content governance status, positioning. */
export default function About() {
  const issues = checkAll(MISSIONS);
  return (
    <Screen header={<Header title="About BrightPath" />}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Wordmark size={40} />
        <Txt v="body" color={colors.textSoft}>
          Small Steps. Brighter Tomorrows.
        </Txt>
      </View>
      <Card style={{ padding: 16 }}>
        <Txt v="subheading">What BrightPath is</Txt>
        <Txt v="body" color={colors.textSoft} style={{ marginTop: 4 }}>
          An educational skill-development and learning-support app for neurodivergent children and the adults who support them. It is not a diagnostic or treatment system.
        </Txt>
      </Card>
      <Card style={{ padding: 16, marginTop: 12 }}>
        <Txt v="subheading">Versions</Txt>
        {Object.entries(VERSIONS).map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Txt v="body" color={colors.textSoft}>
              {k}
            </Txt>
            <Txt v="label">{v}</Txt>
          </View>
        ))}
      </Card>
      <Card style={{ padding: 16, marginTop: 12 }}>
        <Txt v="subheading">Content governance</Txt>
        <Txt v="bodySm" color={colors.textSoft} style={{ marginBottom: 8 }}>{`Automated checks: ${issues.length === 0 ? 'all missions pass' : `${issues.length} issue(s)`}`}</Txt>
        {MISSIONS.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Txt v="body">{`${m.title} v${m.version}`}</Txt>
            <Txt v="caption" color={colors.primaryDeep}>
              {REVIEW_STAGES.find((s) => s.key === m.reviewStatus)?.label}
            </Txt>
          </View>
        ))}
        <Txt v="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
          Missions are “Pilot ready”: professional, agency, editorial and user review are still required before any approved release or effectiveness claim.
        </Txt>
      </Card>
    </Screen>
  );
}

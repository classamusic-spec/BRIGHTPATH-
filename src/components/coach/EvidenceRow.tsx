import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { missionById } from '@/content/missions';
import { OUTCOME_LABELS, SUPPORT_LABELS } from '@/engine/evidence';
import type { Observation } from '@/engine/types';
import { colors, radius } from '@/theme';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function evidenceTitle(o: Observation): string {
  return o.title ?? (o.missionId ? missionById(o.missionId)?.title : undefined) ?? (o.context.setting === 'app' ? 'In-app practice' : cap(o.context.setting));
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * One observation, the same way on every coach screen: what and when, the
 * adult's note, then setting / outcome / support chips. Access-limited moments
 * are named as such (never a miss), and "Independent" is said once.
 */
export function EvidenceRow({ obs, style }: { obs: Observation; style?: StyleProp<ViewStyle> }) {
  const accessLimited = obs.outcome === 'accessLimited' || obs.quality === 'accessLimited';
  const setting = obs.context.setting === 'app' ? 'In the app' : cap(obs.context.setting);
  const showSupport = !accessLimited && !(obs.supportLevel === 1 && obs.outcome === 'independent');
  const photo = obs.photos?.[0];
  return (
    <View style={[{ flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 12 }, style]} accessible accessibilityLabel={`${evidenceTitle(obs)}, ${shortDate(obs.at)}. ${obs.note ?? ''} ${setting}. ${accessLimited ? 'Access limited, not a miss' : OUTCOME_LABELS[obs.outcome]}${showSupport ? `, ${SUPPORT_LABELS[obs.supportLevel]}` : ''}.`}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt v="label" color={colors.ink} style={{ flex: 1, fontSize: 16 }} numberOfLines={1}>
            {evidenceTitle(obs)}
          </Txt>
          <Txt v="caption" color={colors.textMuted}>
            {shortDate(obs.at)}
          </Txt>
        </View>
        {obs.note ? (
          <Txt v="bodySm" color={colors.textSoft} numberOfLines={2}>
            {obs.note}
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <Chip size="sm" tone="sky" label={setting} />
          <Chip size="sm" tone={accessLimited ? 'lavender' : 'butter'} label={accessLimited ? 'Access limited — not a miss' : OUTCOME_LABELS[obs.outcome]} />
          {showSupport ? <Chip size="sm" tone="white" label={SUPPORT_LABELS[obs.supportLevel]} style={{ borderColor: colors.line, borderWidth: 1 }} /> : null}
        </View>
      </View>
      {photo ? <Image source={{ uri: photo }} style={{ width: 56, height: 56, borderRadius: 12 }} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
    </View>
  );
}

import { View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Txt } from '@/components/ui';
import { MODE_COPY } from '@/engine/decision';
import type { JourneyMode } from '@/engine/types';
import { colors } from '@/theme';

const MODES: JourneyMode[] = ['discover', 'practice', 'explore', 'remember'];

/** Discover → Practice → Explore → Remember, with earlier stages marked done. */
export function JourneyStepper({ mode }: { mode: JourneyMode }) {
  const at = MODES.indexOf(mode);
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }} accessible accessibilityLabel={`Journey: ${MODES.map((m, i) => `${MODE_COPY[m].label} ${i < at ? 'done' : i === at ? 'now' : 'later'}`).join(', ')}`}>
      {MODES.map((m, i) => {
        const done = i < at;
        const now = i === at;
        return (
          <View key={m} style={{ flex: 1, minWidth: 0, flexDirection: 'row', gap: 3, paddingVertical: 5, paddingHorizontal: 4, borderRadius: 999, backgroundColor: now ? colors.primary : done ? colors.mintSoft : '#EEF2F9', alignItems: 'center', justifyContent: 'center' }}>
            {done ? <Icon name="check" size={12} color={colors.mintText} /> : null}
            <Txt v="caption" color={now ? '#FFFFFF' : done ? colors.mintText : colors.textMuted} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ flexShrink: 1 }}>
              {MODE_COPY[m].label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

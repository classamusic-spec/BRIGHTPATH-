import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { shadows } from '@/theme';

import { Tap } from './Tap';
import { Txt } from './Txt';

export type NavItem = { key: string; label: string; icon: IconName; onPress: () => void };

/** Five-item bottom navigation used on hub screens (Home, Dashboard, Growth Map). */
export function BottomNav({ items, active }: { items: NavItem[]; active: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.key === active;
        const col = on ? '#1A6CF2' : '#5F72B5';
        return (
          <Tap
            key={it.key}
            onPress={it.onPress}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={it.label}
            scale={0.92}
          >
            <Icon name={it.icon} size={it.icon === 'tabStar' ? 36 : 33} color={col} />
            <Txt v="caption" color={col} style={{ marginTop: 2, fontSize: 15.5, fontFamily: on ? 'Nunito_800ExtraBold' : 'Nunito_700Bold' }}>
              {it.label}
            </Txt>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 6,
    ...shadows.card,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
});

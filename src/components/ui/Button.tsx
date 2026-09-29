import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows } from '@/theme';

import { Tap } from './Tap';
import { Txt } from './Txt';

type Kind = 'primary' | 'soft' | 'ghost' | 'white' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  size = 'lg',
  icon,
  style,
  disabled,
  accessibilityHint,
}: {
  title: string;
  onPress?: () => void;
  kind?: Kind;
  size?: 'lg' | 'md' | 'sm';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const h = size === 'lg' ? 62 : size === 'md' ? 48 : 38;
  const bg =
    kind === 'primary' ? colors.primary : kind === 'soft' ? colors.primarySoft : kind === 'white' ? colors.card : kind === 'danger' ? '#FDE7EC' : 'transparent';
  const fg = kind === 'primary' ? colors.onPrimary : kind === 'danger' ? '#D8385E' : colors.text;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      sound={kind === 'primary'}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      style={[
        styles.base,
        { height: h, backgroundColor: bg, borderRadius: radius.pill },
        kind === 'primary' ? shadows.button : null,
        kind === 'white' ? shadows.soft : null,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon}
        <Txt v={size === 'lg' ? 'button' : size === 'md' ? 'buttonSm' : 'label'} color={fg} numberOfLines={1}>
          {title}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

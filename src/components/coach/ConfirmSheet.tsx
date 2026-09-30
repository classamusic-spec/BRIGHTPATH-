import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button, Sheet, Txt } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Confirmation before anything destructive: a plain Cancel and a clearly
 * marked danger action. Extra content (a typed confirmation, a gentler
 * alternative) goes in `children`, above the buttons.
 */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmTitle,
  onConfirm,
  onCancel,
  confirmDisabled,
  children,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <Sheet visible={visible} onClose={onCancel} title={title}>
      {body ? (
        <Txt v="body" color={colors.text} style={{ marginBottom: 14 }}>
          {body}
        </Txt>
      ) : null}
      {children}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        <Button title="Cancel" kind="white" size="md" onPress={onCancel} style={{ flex: 1 }} />
        <Button title={confirmTitle} kind="danger" size="md" onPress={onConfirm} disabled={confirmDisabled} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

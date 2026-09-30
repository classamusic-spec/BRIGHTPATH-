import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { Tap } from '@/components/ui/Tap';
import { colors, fonts, radius } from '@/theme';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  keyboardType,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? (
        <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
          {label}
        </Txt>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        accessibilityLabel={label ?? placeholder}
        style={{
          fontFamily: fonts.semibold,
          fontSize: 17,
          color: colors.text,
          backgroundColor: '#FFFFFF',
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: focus ? colors.primary : colors.line,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 120 : 50,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {maxLength ? (
        <Txt v="caption" color={colors.textFaint} style={{ alignSelf: 'flex-end', marginTop: 4 }}>{`${value.length}/${maxLength}`}</Txt>
      ) : null}
    </View>
  );
}

/** Wrapping single/multi choice chips. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  multi = false,
}: {
  /** `note` adds a small second line (e.g. "Already a goal"); `disabled` greys a chip out. */
  options: { key: T; label: string; note?: string; disabled?: boolean }[];
  value: T | T[];
  onChange: (v: T | T[]) => void;
  multi?: boolean;
}) {
  const selected = (k: T) => (Array.isArray(value) ? value.includes(k) : value === k);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {options.map((o) => {
        const on = selected(o.key);
        return (
          <Tap
            key={o.key}
            onPress={() => {
              if (!multi) return onChange(o.key);
              const arr = Array.isArray(value) ? value : [];
              onChange(on ? arr.filter((x) => x !== o.key) : [...arr, o.key]);
            }}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            disabled={o.disabled}
            accessibilityState={{ checked: on, selected: on, disabled: !!o.disabled }}
            accessibilityLabel={o.note ? `${o.label}, ${o.note}` : o.label}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              minHeight: 44,
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: on ? colors.primaryPressed : '#FFFFFF',
              borderWidth: 1.5,
              borderColor: on ? colors.primaryPressed : colors.line,
            }}
            scale={0.95}
          >
            <Txt v="label" color={on ? '#FFFFFF' : colors.text} style={{ fontSize: 15 }}>
              {o.label}
            </Txt>
            {o.note ? (
              <Txt v="caption" color={on ? '#FFFFFF' : colors.textMuted} style={{ fontSize: 12.5 }}>
                {o.note}
              </Txt>
            ) : null}
          </Tap>
        );
      })}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Txt v="subheading" color={colors.ink} style={{ marginTop: 14, marginBottom: 8, fontSize: 19 }} accessibilityRole="header">
      {children}
    </Txt>
  );
}

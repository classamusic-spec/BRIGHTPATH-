import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Measures the space it is given and renders children with the largest size
 * that fits (e.g. a character that grows on taller phones).
 */
export function FitBox({
  children,
  style,
  aspect = 1,
  max = 9999,
  min = 0,
}: {
  children: (size: number) => ReactNode;
  style?: StyleProp<ViewStyle>;
  /** width / height of the child. */
  aspect?: number;
  max?: number;
  min?: number;
}) {
  const [size, setSize] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const s = Math.max(min, Math.min(max, height, width / aspect));
    if (Math.abs(s - size) > 1) setSize(s);
  };
  return (
    <View style={[{ flex: 1 }, style]} onLayout={onLayout}>
      {size > 0 ? children(size) : null}
    </View>
  );
}

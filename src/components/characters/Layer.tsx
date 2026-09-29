import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import Svg from 'react-native-svg';

type AnyStyle = StyleProp<ViewStyle> | AnimatedStyle<ViewStyle>;
export type LayerStyle = AnyStyle | AnyStyle[];

/**
 * A full-bleed SVG sheet. Characters are rigged as a stack of these sheets that
 * share one viewBox, so each body part can be transformed independently on the
 * UI thread (Reanimated) around a pivot expressed in viewBox units.
 */
export function Layer({
  vb,
  style,
  children,
}: {
  vb: string;
  style?: AnyStyle | AnyStyle[];
  children: ReactNode;
}) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style as never]}>
      <Svg width="100%" height="100%" viewBox={vb}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** A transformable container for nested layers (e.g. the head rig). */
export function Rig({ style, children }: { style?: AnyStyle | AnyStyle[]; children: ReactNode }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style as never]}>
      {children}
    </Animated.View>
  );
}

/** Converts a pivot in viewBox units to a percentage transform-origin. */
export function pivot(x: number, y: number, w: number, h: number): ViewStyle {
  return { transformOrigin: `${((x / w) * 100).toFixed(2)}% ${((y / h) * 100).toFixed(2)}%` } as ViewStyle;
}

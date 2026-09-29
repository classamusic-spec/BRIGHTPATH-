import { createContext, useContext, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg from 'react-native-svg';

import type { LayerStyle } from '@/components/characters/Layer';

type Box = { left: number; top: number; width: number; height: number; scale: number; vbW: number; vbH: number };

const StageCtx = createContext<Box | null>(null);

/**
 * Lays out an illustration authored in a fixed viewBox inside any container,
 * either covering it (`slice`) or fitting it (`meet`). Children use
 * StageLayer / StageNode so SVG art, animated layers and interactive React
 * Native elements stay perfectly aligned on every screen size.
 */
export function Stage({
  vbW,
  vbH,
  fit = 'slice',
  align = 'center',
  style,
  children,
}: {
  vbW: number;
  vbH: number;
  fit?: 'slice' | 'meet';
  align?: 'center' | 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 0.5 || Math.abs(size.h - height) > 0.5) setSize({ w: width, h: height });
  };
  let box: Box | null = null;
  if (size && size.w > 0 && size.h > 0) {
    const s = fit === 'slice' ? Math.max(size.w / vbW, size.h / vbH) : Math.min(size.w / vbW, size.h / vbH);
    const width = vbW * s;
    const height = vbH * s;
    const left = (size.w - width) / 2;
    const top = align === 'top' ? 0 : align === 'bottom' ? size.h - height : (size.h - height) / 2;
    box = { left, top, width, height, scale: s, vbW, vbH };
  }
  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={onLayout}>
      {box ? <StageCtx.Provider value={box}>{children}</StageCtx.Provider> : null}
    </View>
  );
}

export function useStage(): Box {
  const b = useContext(StageCtx);
  if (!b) throw new Error('useStage must be used inside <Stage>');
  return b;
}

/** Full-stage SVG sheet (optionally animated around a viewBox pivot). */
export function StageLayer({ children, style, pivotAt }: { children: ReactNode; style?: LayerStyle; pivotAt?: [number, number] }) {
  const b = useStage();
  const origin = pivotAt ? { transformOrigin: `${((pivotAt[0] / b.vbW) * 100).toFixed(2)}% ${((pivotAt[1] / b.vbH) * 100).toFixed(2)}%` } : null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height }, origin as ViewStyle, style as never]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${b.vbW} ${b.vbH}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Places React Native content at a viewBox point. */
export function StageNode({
  x,
  y,
  w,
  h,
  anchor = 'center',
  children,
  style,
  scaleContent = false,
}: {
  x: number;
  y: number;
  /** Width/height in viewBox units (scaled). */
  w?: number;
  h?: number;
  anchor?: 'center' | 'bottom' | 'top-left' | 'left';
  /** Content, or a render function receiving the node's size in points. */
  children: ReactNode | ((size: { width: number; height: number; scale: number }) => ReactNode);
  style?: StyleProp<ViewStyle>;
  scaleContent?: boolean;
}) {
  const b = useStage();
  const width = w !== undefined ? w * b.scale : undefined;
  const height = h !== undefined ? h * b.scale : undefined;
  const px = b.left + x * b.scale;
  const py = b.top + y * b.scale;
  const pos: ViewStyle = { position: 'absolute' };
  if (anchor === 'top-left') {
    pos.left = px;
    pos.top = py;
  } else if (anchor === 'bottom') {
    pos.left = px - (width ?? 0) / 2;
    pos.top = py - (height ?? 0);
  } else if (anchor === 'left') {
    pos.left = px;
    pos.top = py - (height ?? 0) / 2;
  } else {
    pos.left = px - (width ?? 0) / 2;
    pos.top = py - (height ?? 0) / 2;
  }
  return (
    <View style={[pos, width !== undefined ? { width } : null, height !== undefined ? { height } : null, scaleContent ? { transform: [{ scale: b.scale }] } : null, style]} pointerEvents="box-none">
      {typeof children === 'function' ? children({ width: width ?? 0, height: height ?? 0, scale: b.scale }) : children}
    </View>
  );
}

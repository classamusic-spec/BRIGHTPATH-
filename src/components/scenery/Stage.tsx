import { createContext, useContext, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg from 'react-native-svg';

import type { LayerStyle } from '@/components/characters/Layer';

type Box = { left: number; top: number; width: number; height: number; scale: number; vbW: number; vbH: number };

type Fit = 'slice' | 'meet';
type Align = 'center' | 'top' | 'bottom';
type Size = { w: number; h: number };

const StageCtx = createContext<Box | null>(null);

/**
 * Where a vbW×vbH illustration lands inside a size.w×size.h container:
 * its scale and the offset of the viewBox origin (points). Exported so
 * screens can map viewBox positions (e.g. map pins) to screen space.
 */
export function stageTransform(size: Size, vb: { w: number; h: number }, fit: Fit = 'slice', align: Align = 'center'): { scale: number; left: number; top: number } {
  const scale = fit === 'slice' ? Math.max(size.w / vb.w, size.h / vb.h) : Math.min(size.w / vb.w, size.h / vb.h);
  const left = (size.w - vb.w * scale) / 2;
  const h = vb.h * scale;
  const top = align === 'top' ? 0 : align === 'bottom' ? size.h - h : (size.h - h) / 2;
  return { scale, left, top };
}

/** True when a style pins the view to all four edges of a full-screen parent. */
function isAbsoluteFill(style: StyleProp<ViewStyle>): boolean {
  const f = StyleSheet.flatten(style);
  return !!f && f.position === 'absolute' && f.left === 0 && f.right === 0 && f.top === 0 && f.bottom === 0;
}

/**
 * First-frame size so full-screen art draws immediately instead of after
 * onLayout: an explicit `initialSize`, 'window', or (for absoluteFill styles)
 * the window size. onLayout corrects it afterwards.
 */
export function useSeedSize(style: StyleProp<ViewStyle>, initialSize?: Size | 'window'): Size | null {
  const win = useWindowDimensions();
  if (initialSize && initialSize !== 'window') return initialSize;
  if (initialSize === 'window' || isAbsoluteFill(style)) return { w: win.width, h: win.height };
  return null;
}

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
  initialSize,
  style,
  children,
}: {
  vbW: number;
  vbH: number;
  fit?: Fit;
  /** Which edge stays in view when `slice` crops vertically. */
  align?: Align;
  /** Size to draw with before the first layout ('window' for full-screen stages). */
  initialSize?: Size | 'window';
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const seed = useSeedSize(style, initialSize);
  const [measured, setSize] = useState<Size | null>(null);
  const size = measured ?? seed;
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!measured || Math.abs(measured.w - width) > 0.5 || Math.abs(measured.h - height) > 0.5) setSize({ w: width, h: height });
  };
  let box: Box | null = null;
  if (size && size.w > 0 && size.h > 0) {
    const t = stageTransform(size, { w: vbW, h: vbH }, fit, align);
    box = { left: t.left, top: t.top, width: vbW * t.scale, height: vbH * t.scale, scale: t.scale, vbW, vbH };
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

/**
 * SVG sheet (optionally animated around a viewBox pivot). By default it
 * covers the whole stage; `box` ([x, y, w, h] in viewBox units) renders a
 * small sheet over just that region, so little animated props do not
 * repaint a full-screen surface.
 */
export function StageLayer({ children, style, pivotAt, box }: { children: ReactNode; style?: LayerStyle; pivotAt?: [number, number]; box?: [number, number, number, number] }) {
  const b = useStage();
  const [bx, by, bw, bh] = box ?? [0, 0, b.vbW, b.vbH];
  const origin = pivotAt ? { transformOrigin: `${(((pivotAt[0] - bx) / bw) * 100).toFixed(2)}% ${(((pivotAt[1] - by) / bh) * 100).toFixed(2)}%` } : null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: b.left + bx * b.scale, top: b.top + by * b.scale, width: bw * b.scale, height: bh * b.scale }, origin as ViewStyle, style as never]}>
      <Svg width="100%" height="100%" viewBox={`${bx} ${by} ${bw} ${bh}`}>
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

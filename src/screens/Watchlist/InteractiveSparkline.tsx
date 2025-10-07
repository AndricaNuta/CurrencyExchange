import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, PanResponder, PanResponderInstance } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

type Point = { x: number; y: number };

type Props = {
  data: number[];
  dates?: string[];
  tint?: string;
  smooth?: boolean;
  showFill?: boolean;
  rounded?: boolean;
  showGlow?: boolean;
  onPointHover?: (index: number, value: number, date?: string, px?: number, py?: number) => void;
  interactive?: boolean;           // enable gestures (set true when expanded)
  strokePx?: number;               // visual only
  glowPx?: number;                 // visual only
  paddingPct?: number;             // 0..0.2 vertical padding in viewBox space
};

const useStyles = makeStyles(() =>
  StyleSheet.create({
    root: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12 },
    overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  })
);

export const InteractiveSparkline: React.FC<Props> = ({
  data,
  dates,
  tint,
  smooth = true,
  showFill = true,
  rounded = true,
  showGlow = true,
  onPointHover,
  interactive = true,
  strokePx = 2,
  glowPx = 6,
  paddingPct = 0.12,
}) => {
  const s = useStyles();
  const theme = useTheme();

  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w && h) setSize({ w, h });
  };

  if (!data || data.length < 2) {
    return <View onLayout={onLayout} collapsable={false} style={s.root} />;
  }

  // Virtual viewBox for crisp scaling
  const VB_W = Math.max(1, data.length - 1);
  const VB_H = 100;
  const pad = VB_H * Math.max(0, Math.min(0.2, paddingPct));

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts: Point[] = useMemo(
    () =>
      data.map((v, i) => {
        const x = (i / (data.length - 1)) * VB_W;
        const y = pad + (VB_H - 2 * pad) * (1 - (v - min) / range);
        return { x, y };
      }),
    [data, min, range, pad]
  );

  const toPath = (p: Point[]) => {
    if (!smooth) return p.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
    const d: string[] = [];
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (i === 0) d.push(`M ${c.x} ${c.y}`);
      else {
        const p0 = p[i - 1];
        const dx = (c.x - p0.x) * 0.5;
        d.push(`C ${p0.x + dx} ${p0.y}, ${c.x - dx} ${c.y}, ${c.x} ${c.y}`);
      }
    }
    return d.join(' ');
  };

  const lineD = useMemo(() => toPath(pts), [pts, smooth]);
  const fillD = useMemo(() => `${lineD} L ${VB_W} ${VB_H} L 0 ${VB_H} Z`, [lineD, VB_W]);

  const color = tint ?? '#6c4ce6';
  const cap = rounded ? 'round' : 'butt';
  const join = rounded ? 'round' : 'miter';

  // --- Gesture mapping (recreated when interactive/size/n change) ---
  const n = data.length;
  const stepX = n > 1 ? size.w / (n - 1) : size.w;

  const emit = (xPx: number) => {
    if (!interactive || stepX <= 0 || size.w <= 0) return;
    // Snap to closest sample index
    const i = Math.max(0, Math.min(n - 1, Math.round(xPx / Math.max(1e-6, stepX))));
    const v = data[i];
    const pxSnap = i * stepX;

    // Convert VB y to px y for the bubble (use snapped index)
    const yNorm = pad + (VB_H - 2 * pad) * (1 - (v - min) / range);
    const pySnap = (yNorm / VB_H) * size.h;

    onPointHover?.(i, v, dates?.[i], pxSnap, pySnap);
  };

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: (_e, g) => interactive && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: (evt) => { emit(evt.nativeEvent.locationX); },
        onPanResponderMove: (evt) => { emit(evt.nativeEvent.locationX); },
        onPanResponderRelease: () => onPointHover?.(-1, NaN, undefined, undefined, undefined),
        onPanResponderTerminate: () => onPointHover?.(-1, NaN, undefined, undefined, undefined),
      }),
    // re-create when these change so closures stay fresh
    [interactive, stepX, size.w, size.h, n, min, range, pad, onPointHover]
  );

  return (
    <View onLayout={onLayout} collapsable={false} style={s.root}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={alpha(color, 0.28)} />
            <Stop offset="1" stopColor={alpha(color, 0.03)} />
          </LinearGradient>
        </Defs>

        {showFill && <Path d={fillD} fill="url(#fillGrad)" />}
        {showGlow && (
          <Path
            d={lineD}
            stroke={alpha(color, 0.35)}
            strokeWidth={glowPx}
            fill="none"
            strokeLinecap={cap}
            strokeLinejoin={join}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <Path
          d={lineD}
          stroke={color}
          strokeWidth={strokePx}
          fill="none"
          strokeLinecap={cap}
          strokeLinejoin={join}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      </Svg>

      {/* transparent capture layer */}
      <View
        style={s.overlay}
        pointerEvents={interactive ? 'auto' : 'none'}
        {...(interactive ? panResponder.panHandlers : {})}
      />
    </View>
  );
};

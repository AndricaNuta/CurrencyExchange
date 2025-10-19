import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {Animated,
  Easing,
  PanResponder,
  Pressable,
  useWindowDimensions,
  GestureResponderEvent,
  PanResponderGestureState,
  StyleSheet,} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings as Gear } from 'react-native-feather';
import { MMKV } from 'react-native-mmkv';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

type Dock = 'left' | 'right' | 'top';

type Props = {
  onPress: () => void;
  size?: number;
  margin?: number;
  peek?: number;
  accent?: string;
  idleOpacity?: number;
  bottomGuardPx?: number;
};

const storage = new MMKV({
  id: 'ui-state'
});
const STORAGE_KEY = 'floating-gear@pos';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function safeReadPosition(raw?: string | null): { dock: Dock; along?: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw as string) as { dock?: string; along?: number };
    const dock: Dock = (parsed.dock === 'left' || parsed.dock === 'right' || parsed.dock === 'top') ? parsed.dock : 'right';
    return {
      dock,
      along: typeof parsed.along === 'number' ? parsed.along : undefined
    };
  } catch {
    return null;
  }
}

export function FloatingSettingsButton({
  onPress,
  size = 56,
  margin = 12,
  peek = 10,
  accent,
  idleOpacity = 0.5,
  bottomGuardPx = 0,
}: Props) {
  const {
    width, height
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const s = useStyles();

  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(idleOpacity)).current;

  const dockRef = useRef<Dock>('right');
  const alongRef = useRef<number>(0);
  const initialized = useRef(false);

  const [dragging, setDragging] = useState(false);
  const fadeOutTimer = useRef<NodeJS.Timeout | null>(null);
  const bounds = useMemo(() => {
    const topMin = insets.top + margin;
    const botMax = height - insets.bottom - bottomGuardPx - margin - size;
    const leftMin = insets.left + margin;
    const rgtMax = width - insets.right - margin - size;
    return {
      topMin,
      botMax,
      leftMin,
      rgtMax
    };
  }, [width, height, insets, margin, size, bottomGuardPx]);

  const midY = useMemo(() => (bounds.topMin + bounds.botMax) / 2, [bounds]);

  const themePrimary = t?.colors?.primary ?? '#7C3AED';
  const themeSurface  = t?.colors?.surface ?? t?.colors?.card ?? '#FFFFFF';
  const themeMuted    = t?.colors?.muted ?? '#6B7280';
  const isDark        = !!t?.isDark;

  const accentColor = accent ?? themePrimary;
  const bgColor     = dragging ? accentColor : themeSurface;
  const iconColor   = dragging ? (t?.colors?.onPrimary ?? '#FFFFFF') : themeMuted;
  const borderColor = isDark
    ? alpha('#FFFFFF', 0.08)
    : alpha('#000000', 0.06);

  const xyForDock = useCallback((dock: Dock, along: number) => {
    switch (dock) {
      case 'left':
        return {
          x: bounds.leftMin - peek,
          y: clamp(along, bounds.topMin, bounds.botMax)
        };
      case 'right':
        return {
          x: bounds.rgtMax + peek,
          y: clamp(along, bounds.topMin, bounds.botMax)
        };
      case 'top':
        return {
          x: clamp(along, bounds.leftMin, bounds.rgtMax),
          y: bounds.topMin - peek
        };
    }
  }, [bounds, peek]);

  const nearestDock = useCallback((x: number, y: number): { dock: Dock; along: number } => {
    const dLeft  = Math.abs(x - bounds.leftMin);
    const dRight = Math.abs(x - bounds.rgtMax);
    const dTop   = Math.abs(y - bounds.topMin);
    const min = Math.min(dLeft, dRight, dTop);
    if (min === dLeft)  return {
      dock: 'left',
      along: y
    };
    if (min === dRight) return {
      dock: 'right',
      along: y
    };
    return                 {
      dock: 'top',
      along: x
    };
  }, [bounds]);

  const animateTo = useCallback((x: number, y: number, spring = true) => {
    if (spring) {
      Animated.parallel([
        Animated.spring(tx, {
          toValue: x,
          useNativeDriver: true
        }),
        Animated.spring(ty, {
          toValue: y,
          useNativeDriver: true
        }),
      ]).start();
    } else {
      tx.setValue(x);
      ty.setValue(y);
    }
  }, [tx, ty]);

  const bumpOpacity = useCallback((to: number) => {
    if (fadeOutTimer.current) {
      clearTimeout(fadeOutTimer.current);
      fadeOutTimer.current = null;
    }
    Animated.timing(opacity, {
      toValue: to,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const scheduleFadeOut = useCallback(() => {
    if (fadeOutTimer.current) clearTimeout(fadeOutTimer.current);
    fadeOutTimer.current = setTimeout(() => bumpOpacity(idleOpacity), 700);
  }, [bumpOpacity, idleOpacity]);

  useEffect(() => {
    if (!initialized.current) {
      const saved = safeReadPosition(storage.getString(STORAGE_KEY));
      const dock = saved?.dock ?? 'right';
      const along = saved?.along ?? midY;

      dockRef.current = dock;
      alongRef.current = along;

      const {
        x, y
      } = xyForDock(dock, along);
      animateTo(x, y, false);
      initialized.current = true;
      return;
    }

    const d = dockRef.current;
    const a = alongRef.current;
    const clampedAlong = d === 'top'
      ? clamp(a, bounds.leftMin, bounds.rgtMax)
      : clamp(a, bounds.topMin, bounds.botMax);

    alongRef.current = clampedAlong;
    const {
      x, y
    } = xyForDock(d, clampedAlong);
    animateTo(x, y, false);
  }, [bounds, midY, xyForDock, animateTo]);

  // gesture handling: small threshold keeps taps working
  const startXY = useRef({
    x: 0,
    y: 0
  });
  const panThreshold = 4;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, g: PanResponderGestureState) =>
        Math.abs(g.dx) > panThreshold || Math.abs(g.dy) > panThreshold,

      onPanResponderGrant: () => {
        setDragging(true);
        bumpOpacity(1);
        tx.stopAnimation((x) => (startXY.current.x = x));
        ty.stopAnimation((y) => (startXY.current.y = y));
      },

      onPanResponderMove: (_e, g) => {
        tx.setValue(startXY.current.x + g.dx);
        ty.setValue(startXY.current.y + g.dy);
      },

      onPanResponderRelease: (_e, g) => {
        setDragging(false);

        const curX = clamp(startXY.current.x + g.dx, bounds.leftMin - peek, bounds.rgtMax + peek);
        const curY = clamp(startXY.current.y + g.dy, bounds.topMin - peek, bounds.botMax + peek);

        const {
          dock, along
        } = nearestDock(curX, curY);
        const rail = dock === 'top'
          ? clamp(along, bounds.leftMin, bounds.rgtMax)
          : clamp(along, bounds.topMin, bounds.botMax);

        dockRef.current = dock;
        alongRef.current = rail;

        const {
          x, y
        } = xyForDock(dock, rail);
        animateTo(x, y, true);

        storage.set(STORAGE_KEY, JSON.stringify({
          dock,
          along: rail
        }));
        scheduleFadeOut();
      },

      onPanResponderTerminate: () => {
        setDragging(false);
        scheduleFadeOut();
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const r = size / 2;
  const extraCurve = size * 0.25;
  const radii = useMemo(() => {
    const d = dockRef.current;
    if (d === 'left') {
      return {
        borderTopRightRadius: r + extraCurve,
        borderBottomRightRadius: r + extraCurve,
        borderTopLeftRadius: r,
        borderBottomLeftRadius: r,
      };
    }
    if (d === 'right') {
      return {
        borderTopLeftRadius: r + extraCurve,
        borderBottomLeftRadius: r + extraCurve,
        borderTopRightRadius: r,
        borderBottomRightRadius: r,
      };
    }
    // top
    return {
      borderBottomLeftRadius: r + extraCurve,
      borderBottomRightRadius: r + extraCurve,
      borderTopLeftRadius: r,
      borderTopRightRadius: r,
    };
  }, [r, extraCurve, dragging]);

  return (
    <Animated.View
      style={[
        s.container,
        {
          width: size,
          height: size,
          transform: [{
            translateX: tx
          }, {
            translateY: ty
          }],
          opacity,
          backgroundColor: bgColor,
          shadowOpacity: dragging ? 0.25 : 0.15,
          borderWidth: dragging ? 0 : StyleSheet.hairlineWidth,
          borderColor,
          ...radii,
        },
      ]}
      {...responder.panHandlers}
    >
      <Pressable
        onPress={onPress}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={[s.pressable, {
          width: size,
          height: size
        }]}
      >
        <Gear width={24} height={24} color={iconColor} />
      </Pressable>
    </Animated.View>
  );
}

/** THEME-AWARE STYLESHEET */
const useStyles = makeStyles((_t) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 4
      },
      elevation: 8,
    },
    pressable: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
);

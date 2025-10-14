import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings as Gear } from 'react-native-feather';
import { MMKV } from 'react-native-mmkv';

type Dock = 'left' | 'right' | 'top' | 'bottom';

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
const KEY = 'floating-gear@pos'; 

export  function FloatingSettingsButton({
  onPress,
  size = 56,
  margin = 12,
  peek = 10,
  accent = '#7C3AED',
  idleOpacity = 0.5,
  bottomGuardPx = 0,
}: Props) {
  const {
    width, height
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  const dockRef = useRef<Dock>('right');
  const alongRef = useRef<number>(0);

  const [dragging, setDragging] = useState(false);
  const opacity = useRef(new Animated.Value(idleOpacity)).current;

  const bounds = useMemo(() => {
    const topMin  = insets.top + margin;
    const botMax  = height - insets.bottom - bottomGuardPx - margin - size;
    const leftMin = insets.left + margin;
    const rgtMax  = width - insets.right - margin - size;
    return { topMin, botMax, leftMin, rgtMax };
  }, [width, height, insets, margin, size, bottomGuardPx]);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const xyForDock = (dock: Dock, along: number) => {
    switch (dock) {
      case 'left':
        return { x: bounds.leftMin - peek, y: clamp(along, bounds.topMin, bounds.botMax) };
      case 'right':
        return { x: bounds.rgtMax + peek, y: clamp(along, bounds.topMin, bounds.botMax) };
      case 'top':
        return { x: clamp(along, bounds.leftMin, bounds.rgtMax), y: bounds.topMin - peek };
    }
  };

  const nearestDock = (x: number, y: number): { dock: Dock; along: number } => {
    const dLeft  = Math.abs(x - bounds.leftMin);
    const dRight = Math.abs(x - bounds.rgtMax);
    const dTop   = Math.abs(y - bounds.topMin);
    const min = Math.min(dLeft, dRight, dTop);
    if (min === dLeft)  return { dock: 'left',  along: y };
    if (min === dRight) return { dock: 'right', along: y };
    return                { dock: 'top',   along: x };
  };

  const animateTo = (x: number, y: number, spring = true) => {
    if (spring) {
      Animated.parallel([
        Animated.spring(tx, { toValue: x, useNativeDriver: true }),
        Animated.spring(ty, { toValue: y, useNativeDriver: true }),
      ]).start();
    } else {
      tx.setValue(x);
      ty.setValue(y);
    }
  };

  // load saved placement (MMKV) or default to right-middle
  useEffect(() => {
    try {
      const raw = storage.getString(KEY);
      let dock: Dock = 'right';
      let along: number;

      if (raw) {
        const parsed = JSON.parse(raw) as { dock: Dock; along: number };
        dock = parsed.dock;
        along = parsed.along;
      } else {
        along = (bounds.topMin + bounds.botMax) / 2;
      }

      dockRef.current = dock;
      alongRef.current = along;
      const {
        x, y
      } = xyForDock(dock, along);
      animateTo(x, y, false);
    } catch {
      const mid = (bounds.topMin + bounds.botMax) / 2;
      const {
        x, y
      } = xyForDock('right', mid);
      animateTo(x, y, false);
    }
  }, [bounds]); // re-place on dimension/safe-area changes

  const bumpOpacity = (to: number) =>
    Animated.timing(opacity, {
      toValue: to,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();

  const startXY = useRef({
    x: 0,
    y: 0
  });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        bumpOpacity(1);
        tx.stopAnimation((x) => (startXY.current.x = x));
        ty.stopAnimation((y) => (startXY.current.y = y));
      },
      onPanResponderMove: (_, g) => {
        tx.setValue(startXY.current.x + g.dx);
        ty.setValue(startXY.current.y + g.dy);
      },
      onPanResponderRelease: (_, g) => {
        setDragging(false);

        const curX = clamp(startXY.current.x + g.dx, bounds.leftMin - peek, bounds.rgtMax + peek);
        const curY = clamp(startXY.current.y + g.dy, bounds.topMin - peek, bounds.botMax + peek);

        const { dock, along } = nearestDock(curX, curY);

        dockRef.current = dock;
        const rail = dock === 'top'
          ? clamp(along, bounds.leftMin, bounds.rgtMax)   // move along X
          : clamp(along, bounds.topMin, bounds.botMax);   // move along Y
        alongRef.current = rail;

        const { x, y } = xyForDock(dock, rail);
        animateTo(x, y, true);

        storage.set(KEY, JSON.stringify({ dock, along: rail }));

        setTimeout(() => bumpOpacity(idleOpacity), 700);
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        setTimeout(() => bumpOpacity(idleOpacity), 700);
      },
    })
  ).current;

  // visual tweaks for “tab” feel
  const bg = dragging ? accent : 'white';
  const iconColor = dragging ? '#fff' : '#6B7280';
  const shadow = dragging ? 0.25 : 0.15;
  const r = size / 2;
  const extraCurve = size * 0.25;
  const radii = (() => {
    const d = dockRef.current;
    if (d === 'left')  return {
      borderTopRightRadius: r + extraCurve,
      borderBottomRightRadius: r + extraCurve,
      borderTopLeftRadius: r,
      borderBottomLeftRadius: r
    };
    if (d === 'right') return {
      borderTopLeftRadius: r + extraCurve,
      borderBottomLeftRadius: r + extraCurve,
      borderTopRightRadius: r,
      borderBottomRightRadius: r
    };
    if (d === 'top')   return {
      borderBottomLeftRadius: r + extraCurve,
      borderBottomRightRadius: r + extraCurve,
      borderTopLeftRadius: r,
      borderTopRightRadius: r
    };
    return              {
      borderTopLeftRadius: r + extraCurve,
      borderTopRightRadius: r + extraCurve,
      borderBottomLeftRadius: r,
      borderBottomRightRadius: r
    };
  })();
  useEffect(() => {
    const raw = storage.getString(KEY);
    let dock: Dock = 'right';
    let along: number;

    try {
      if (raw) {
        const parsed = JSON.parse(raw) as { dock: Dock | 'bottom'; along: number };
        dock = (parsed.dock === 'bottom' ? 'right' : parsed.dock) as Dock;
        along = parsed.along ?? (bounds.topMin + bounds.botMax) / 2;
      } else {
        along = (bounds.topMin + bounds.botMax) / 2;
      }
    } catch {
      along = (bounds.topMin + bounds.botMax) / 2;
    }

    dockRef.current = dock;
    alongRef.current = along;

    const { x, y } = xyForDock(dock, along);
    animateTo(x, y, false);
  }, [bounds]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        transform: [{
          translateX: tx
        }, {
          translateY: ty
        }],
        opacity,
        backgroundColor: bg,
        ...radii,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: shadow,
        shadowRadius: 12,
        shadowOffset: {
          width: 0,
          height: 4
        },
        elevation: 8,
        borderWidth: dragging ? 0 : 1,
        borderColor: 'rgba(0,0,0,0.06)',
      }}
      {...responder.panHandlers}
    >
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Gear width={24} height={24} color={iconColor} />
      </Pressable>
    </Animated.View>
  );
}

// src/components/TipComponents/FirstTimeTipPressable.tsx
/* eslint-disable max-len */
import React, {useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle,} from 'react';
import { GestureResponderEvent, Pressable, ViewStyle, Animated, Easing } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { getBool, setBool, delKey } from '../../services/mmkv';

export type Placement = 'top' | 'bottom' | 'left' | 'right';
export type ContentFactory = (api: { close: () => void }) => React.ReactNode;

export type FirstTimeTipPressableHandle = {
  /** Open the tip now (ignores "seen" state) */
  open: () => void;
  /** Close the tip now */
  close: () => void;
  /** Has the tip been seen (persisted)? */
  isSeen: () => boolean;
  /** Mark as seen/unseen */
  setSeen: (v: boolean) => void;
  /** Clear persistence entirely */
  resetSeen: () => void;
  /** Mark as seen AND open now (useful for “show once now”) */
  forceShowOnce: () => void;
};

export type FirstTimeTipPressableProps = {
  storageKey?: string;                               // "show once" key
  content: React.ReactNode | ContentFactory;         // node or factory({close})
  placement?: Placement;
  onPress?: (e?: GestureResponderEvent) => void;      // original action
  children: React.ReactElement;                      // anchor
  tooltipStyle?: ViewStyle;
  blockActionOnFirstPress?: boolean;                 // default: true
  runActionAfterClose?: boolean;                     // if first-time, run after closing
  backdrop?: string;                                 // dimmer
  enableAnchorPulse?: boolean;
  fallbackPlacement?: Placement;
  onFirstShow?: () => void;
  autoOpenOnFirstPress?: boolean;
  interceptPress?: boolean;
  showAnchorClone?: boolean;      // NEW: default false
  childContentSpacing?: number;
  displayInsets?: { top: number; left: number; right: number; bottom: number }; // NEW        // analytics hook
};

export const FirstTimeTipPressable = forwardRef<FirstTimeTipPressableHandle, FirstTimeTipPressableProps>(({
  storageKey,
  content,
  placement = 'top',
  onPress,
  children,
  displayInsets = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  blockActionOnFirstPress = true,
  runActionAfterClose = false,
  backdrop = 'rgba(0,0,0,0.20)',
  enableAnchorPulse = true,
  autoOpenOnFirstPress = true,
  interceptPress = true,
  onFirstShow,
  showAnchorClone = false,
  childContentSpacing = 8,
}, ref) => {
  const [visible, setVisible] = useState(false);
  const [currentPlacement, setCurrentPlacement] = useState<Placement>(placement);
  const scale = useRef(new Animated.Value(1)).current;
  const pendingRunRef = useRef(false); // run action after close if requested

  const seen = useCallback(() => (storageKey ? getBool(storageKey) : false), [storageKey]);
  const markSeen = useCallback((v: boolean) => {
    if (!storageKey) return;
    if (v) setBool(storageKey, true);
    else delKey(storageKey);
  }, [storageKey]);

  const pulse = useCallback(() => {
    if (!enableAnchorPulse) return;
    scale.setValue(0.96);
    Animated.timing(scale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [enableAnchorPulse, scale]);

  const openUI = useCallback(() => {
    requestAnimationFrame(() => {
      setCurrentPlacement(placement);
      setVisible(true);
      pulse();
      onFirstShow?.();
    });
  }, [placement, pulse, onFirstShow]);

  const closeUI = useCallback(() => {
    setVisible(false);
  }, []);

  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      const alreadySeen = seen();

      if (!alreadySeen && autoOpenOnFirstPress) {
        if (storageKey) setBool(storageKey, true);
        openUI();
        if (runActionAfterClose) pendingRunRef.current = true;
        if (blockActionOnFirstPress) return;
      }

      onPress?.(e);
    },
    [seen, storageKey, autoOpenOnFirstPress, openUI, runActionAfterClose, blockActionOnFirstPress, onPress],
  );

  const close = useCallback(() => {
    closeUI();
    if (pendingRunRef.current) {
      pendingRunRef.current = false;
      requestAnimationFrame(() => onPress?.());
    }
  }, [closeUI, onPress]);

  // imperative controller
  useImperativeHandle(ref, () => ({
    open: openUI,
    close: closeUI,
    isSeen: seen,
    setSeen: markSeen,
    resetSeen: () => storageKey && delKey(storageKey),
    forceShowOnce: () => {
      if (storageKey) setBool(storageKey, true);
      openUI();
    },
  }), [openUI, closeUI, seen, markSeen, storageKey]);

  const node = useMemo(
    () => (typeof content === 'function' ? (content as ContentFactory)({
      close
    }) : content),
    [content, close],
  );
  const [size, setSize] = useState<{w:number; h:number} | null>(null);

  // compose child's onPress (don’t clobber)
  const composedChild = useMemo(() => {
    if (!interceptPress) return children; // anchor mode: don't inject onPress
    const childOnPress = (children.props as any).onPress as ((e?: any) => void) | undefined;
    const merged = (e?: GestureResponderEvent) => {
      handlePress(e);
      if (!visible || !blockActionOnFirstPress) childOnPress?.(e);
    };
    return React.cloneElement(children, {
      onPress: merged,
      accessibilityRole: (children.props as any).accessibilityRole ?? 'button'
    });
  }, [children, interceptPress, handlePress, visible, blockActionOnFirstPress]);

  return (
    <Tooltip
      isVisible={visible}
      placement={currentPlacement}
      onClose={close}
      backgroundColor={backdrop}
      displayInsets={displayInsets}
      useInteractionManager
      showChildInTooltip={showAnchorClone}   // ✅ hide the “ghost” by default
      childContentSpacing={childContentSpacing}
      tooltipStyle={{
        backgroundColor: 'transparent',
        padding: 0,
        borderWidth: 0,
        shadowColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
      }}
      contentStyle={{
        backgroundColor: 'transparent',
        padding: 0
      }}
      arrowSize={{
        width: 0,
        height: 0
      }} // <- hides library arrow
      content={node}
    >

      <Animated.View  onLayout={e => setSize({
        w: e.nativeEvent.layout.width,
        h: e.nativeEvent.layout.height
      })}
      style={[
        {
          transform: [{
            scale
          }]
        },
        size && {
          width: size.w,
          height: size.h
        }
      ]}
      >
        {composedChild}
      </Animated.View>
    </Tooltip>
  );
});

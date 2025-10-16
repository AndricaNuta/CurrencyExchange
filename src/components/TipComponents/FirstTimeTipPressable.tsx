/* eslint-disable max-len */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, ViewStyle, Animated, Easing } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { getBool, setBool } from '../../services/mmkv';

export type Placement = 'top' | 'bottom' | 'left' | 'right';
export type ContentFactory = (api: { close: () => void }) => React.ReactNode;

export type FirstTimeTipPressableProps = {
  /** Persist key. If omitted, behaves like a normal tip (no "show once"). */
  storageKey?: string;
  /** Static node or factory receiving { close } */
  content: React.ReactNode | ContentFactory;
  placement?: Placement;
  /** Original action for the control */
  onPress: (e?: GestureResponderEvent) => void;
  /** The anchored control (icon/button) */
  children: React.ReactElement;
  /** Extra styling for the tooltip's container (outer) */
  tooltipStyle?: ViewStyle;
  /** Block the first tap to show the tip (default true). */
  blockActionOnFirstPress?: boolean;
  /** If true, runs the original action automatically when the user closes the first tip. */
  runActionAfterClose?: boolean;
  /** Dimmer color */
  backdrop?: string;
  /** Small pulse on anchor when showing the tip */
  enableAnchorPulse?: boolean;
  /** If placement overflows, switch to this once */
  fallbackPlacement?: Placement;
  /** Called the very first time the tip shows (analytics hook) */
  onFirstShow?: () => void;
};

export const FirstTimeTipPressable: React.FC<FirstTimeTipPressableProps> = ({
  storageKey,
  content,
  placement = 'top',
  onPress,
  children,
  tooltipStyle,
  blockActionOnFirstPress = true,
  runActionAfterClose = false,
  backdrop = 'rgba(0,0,0,0.20)',
  enableAnchorPulse = true,
  fallbackPlacement = 'bottom',
  onFirstShow,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentPlacement, setCurrentPlacement] = useState<Placement>(placement);
  const scale = useRef(new Animated.Value(1)).current;
  const pendingRunRef = useRef(false); // run action after close if requested

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

  const openTip = useCallback(() => {
    requestAnimationFrame(() => {
      setCurrentPlacement(placement);
      setVisible(true);
      pulse();
      onFirstShow?.();
    });
  }, [placement, pulse, onFirstShow]);

  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      const seen = storageKey ? getBool(storageKey) : false;

      if (!seen) {
        if (storageKey) setBool(storageKey, true);
        openTip();

        // auto-run after close (only for first-time)
        if (runActionAfterClose) pendingRunRef.current = true;

        if (blockActionOnFirstPress) return; // block first action
      }

      // otherwise (or not blocking), run now
      onPress?.(e);
    },
    [storageKey, openTip, runActionAfterClose, blockActionOnFirstPress, onPress],
  );

  const close = useCallback(() => {
    setVisible(false);
    if (pendingRunRef.current) {
      pendingRunRef.current = false;
      // give the modal a frame to close before firing action
      requestAnimationFrame(() => onPress?.());
    }
  }, [onPress]);

  const node = useMemo(
    () => (typeof content === 'function' ? (content as ContentFactory)({
      close
    }) : content),
    [content, close],
  );

  // compose child's onPress instead of clobbering it
  const composedChild = useMemo(() => {
    const childOnPress = (children.props as any).onPress as ((e?: any) => void) | undefined;
    const merged = (e?: GestureResponderEvent) => {
      handlePress(e);
      // only call child's original if we didn't block the action
      if (!visible || !blockActionOnFirstPress) childOnPress?.(e);
    };
    return React.cloneElement(children, {
      onPress: merged,
      accessibilityRole: (children.props as any).accessibilityRole ?? 'button'
    });
  }, [children, handlePress, visible, blockActionOnFirstPress]);

  return (
    <Tooltip
      isVisible={visible}
      content={node}
      placement={currentPlacement}
      onClose={close}
      tooltipStyle={[{
        backgroundColor: 'transparent',
        padding: 0
      }, tooltipStyle]}
      backgroundColor={backdrop}
      useInteractionManager
      onOpen={() => setCurrentPlacement(placement)} // reset preferred on each open
      // NOTE: library doesn't expose overflow callbacks; if you ever need to force-flip,
      // toggle a key here or drive via state using `fallbackPlacement`.
    >
      <Animated.View style={{
        transform: [{
          scale
        }]
      }}>{composedChild}</Animated.View>
    </Tooltip>
  );
};

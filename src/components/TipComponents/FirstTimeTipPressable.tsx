import React, {useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle, useEffect,} from 'react';
import { GestureResponderEvent, Animated, Easing, InteractionManager, useWindowDimensions } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { getBool, setBool, delKey } from '../../services/mmkv';
import { useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export type Placement = 'top' | 'bottom' | 'left' | 'right';
export type ContentFactory = (api: { close: () => void }) => React.ReactNode;

export type FirstTimeTipPressableHandle = {
  open: () => void;
  close: () => void;
  isSeen: () => boolean;
  setSeen: (v: boolean) => void;
  resetSeen: () => void;
  forceShowOnce: () => void;
};

export type FirstTimeTipPressableProps = {
  storageKey?: string;
  content: React.ReactNode | ContentFactory;
  placement?: Placement;
  onPress?: (e?: GestureResponderEvent) => void;
  children: React.ReactElement;
  blockActionOnFirstPress?: boolean;
  runActionAfterClose?: boolean;
  backdrop?: string;
  enableAnchorPulse?: boolean;
  onFirstShow?: () => void;
  autoOpenOnFirstPress?: boolean;
  interceptPress?: boolean;
  showAnchorClone?: boolean;
  childContentSpacing?: number;
  displayInsets?: { top: number; left: number; right: number; bottom: number };
  onAfterClose?: () => void;
  recalcKey?: any;
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
  backdrop,
  recalcKey,
  enableAnchorPulse = true,
  autoOpenOnFirstPress = true,
  interceptPress = true,
  onFirstShow,
  showAnchorClone = false,
  childContentSpacing = 8,
  onAfterClose
}, ref) => {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const pendingRunRef = useRef(false);
  const closedFlag = useRef(false);

  const seen = useCallback(() => (storageKey ? getBool(storageKey) : false), [storageKey]);
  const markSeen = useCallback((v: boolean) => {
    if (!storageKey) return;
    v ? setBool(storageKey, true) : delKey(storageKey);
  }, [storageKey]);

  const pulse = useCallback(() => {
    if (!enableAnchorPulse) return;
    scale.setValue(0.96);
    Animated.timing(scale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [enableAnchorPulse, scale]);

  const openUI = useCallback(() => {
    requestAnimationFrame(() => {
      setVisible(true);
      pulse();
      onFirstShow?.();
    });
  }, [pulse, onFirstShow]);

  const closeUI = useCallback(() => {
    closedFlag.current = true;
    setVisible(false);
  }, []);
  useEffect(() => {
    if (!visible && closedFlag.current) {
      closedFlag.current = false;
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => onAfterClose?.());
      });
    }
  }, [visible, onAfterClose]);

  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      const alreadySeen = seen();

      if (!alreadySeen && autoOpenOnFirstPress) {
        markSeen(true);
        openUI();
        if (runActionAfterClose) pendingRunRef.current = true;
        if (blockActionOnFirstPress) return;
      }
      onPress?.(e);
    },
    [seen, autoOpenOnFirstPress, markSeen, openUI, runActionAfterClose, blockActionOnFirstPress, onPress],
  );

  const close = useCallback(() => {
    closeUI();
    if (pendingRunRef.current) {
      pendingRunRef.current = false;
      requestAnimationFrame(() => onPress?.());
    }
  }, [closeUI, onPress]);

  useImperativeHandle(ref, () => ({
    open: openUI,
    close: closeUI,
    isSeen: seen,
    setSeen: markSeen,
    resetSeen: () => storageKey,
    forceShowOnce: () => {
      markSeen(true);
      openUI();
    },
  }), [openUI, closeUI, seen, markSeen, storageKey]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const {
    width: winW, height: winH
  } = useWindowDimensions();
  useEffect(() => { setSize(null); }, [winW, winH]);

  // ❷ allow parent to request a re-measure (e.g., after expand)
  useEffect(() => { if (recalcKey != null) setSize(null); }, [recalcKey]);

  const node = useMemo(
    () => (typeof content === 'function' ? (content as ContentFactory)({
      close
    }) : content),
    [content, close],
  );

  const composedChild = useMemo(() => {
    if (!interceptPress) return children;
    const childOnPress = (children.props as any).onPress as ((e?: any) => void) | undefined;
    const merged = (e?: GestureResponderEvent) => {
      handlePress(e);
      if (!visible || !blockActionOnFirstPress) childOnPress?.(e);
    };
    return React.cloneElement(children, {
      onPress: merged,
      accessibilityRole: (children.props as any).accessibilityRole ?? 'button',
    });
  }, [children, interceptPress, handlePress, visible, blockActionOnFirstPress]);

  const backdropColor =
    backdrop ?? (t.scheme === 'dark' ? alpha('#000000', 0.55) : alpha('#000000', 0.20));

  return (
    <Tooltip
      isVisible={visible}
      placement={placement}
      onClose={close}
      backgroundColor={backdropColor}
      displayInsets={displayInsets}
      useInteractionManager
      showChildInTooltip={showAnchorClone}
      childContentSpacing={childContentSpacing}
      tooltipStyle={{
        backgroundColor: 'transparent',
        padding: 0,
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0
      }}
      contentStyle={{
        backgroundColor: 'transparent',
        padding: 0
      }}
      arrowSize={{
        width: 0,
        height: 0
      }}
      content={node}
    >
      <Animated.View
        onLayout={e => setSize({
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
            width: size.w
          }                    // ✅ lock width only
        ]}
      >
        {composedChild}
      </Animated.View>
    </Tooltip>
  );
});

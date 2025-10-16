import React, { useContext, useEffect, useRef } from 'react';
import { View, ViewProps, Dimensions } from 'react-native';
import { SpotlightContext } from './SpotlightProvider';

export type SpotlightTargetProps = ViewProps & { id: string; testID?: string };

export const SpotlightTarget: React.FC<SpotlightTargetProps> = ({ id, children, onLayout, ...rest }) => {
  const ctx = useContext(SpotlightContext);
  const ref = useRef<View>(null);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  // Unregister on unmount only (avoid loops)
  useEffect(() => {
    return () => ctxRef.current?.unregisterTarget(id);
  }, [id]);

  const measureNow = () => {
    // queue to next frame so layout is final (safe areas, shadows, etc.)
    requestAnimationFrame(() => {
      ref.current?.measureInWindow?.((x, y, width, height) => {
        if (
          typeof x === 'number' && typeof y === 'number' &&
          typeof width === 'number' && typeof height === 'number' &&
          width > 0 && height > 0
        ) {
          ctxRef.current?.registerTarget(id, { x, y, width, height });
        }
      });
    });
  };

  // 1) When this view lays out
  const handleLayout: ViewProps['onLayout'] = (e) => {
    onLayout?.(e);
    measureNow();
  };

  // 2) When spotlight becomes visible (e.g., after start()), re-measure
  useEffect(() => {
    if (ctx?.visible) measureNow();
  }, [ctx?.visible]);

  // 3) On orientation/size changes, re-measure
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', measureNow);
    return () => sub.remove();
  }, []);

  return (
    <View ref={ref} {...rest} onLayout={handleLayout}>
      {children}
    </View>
  );
};

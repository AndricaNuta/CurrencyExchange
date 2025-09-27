import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = PropsWithChildren<{
  minScale?: number;
  maxScale?: number;
}>;

export default function ZoomableCanvas({
  children, minScale = 1, maxScale = 3
}: Props) {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const saved = {
    s: useSharedValue(1),
    x: useSharedValue(0),
    y: useSharedValue(0)
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      saved.x.value = tx.value;
      saved.y.value = ty.value;
    })
    .onUpdate(e => {
      tx.value = saved.x.value + e.translationX;
      ty.value = saved.y.value + e.translationY;
    });

  const pinch = Gesture.Pinch()
    .onStart(() => { saved.s.value = scale.value; })
    .onUpdate(e => {
      const next = Math.min(maxScale, Math.max(minScale, saved.s.value * e.scale));
      scale.value = next;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const to = scale.value > 1 ? 1 : 2;
      scale.value = withTiming(to, {
        duration: 220
      });
      if (to === 1) { tx.value = withTiming(0); ty.value = withTiming(0); }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{
      translateX: tx.value
    }, {
      translateY: ty.value
    }, {
      scale: scale.value
    }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinch, doubleTap)}>
      <View style={{
        flex: 1,
        overflow: 'hidden'
      }}>
        <Animated.View style={[{
          flex: 1
        }, style]}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}

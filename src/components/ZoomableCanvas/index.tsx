import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {styles} from './styles';

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
  const rot = useSharedValue(0);

  const saved = {
    s: useSharedValue(1),
    x: useSharedValue(0),
    y: useSharedValue(0),
    r: useSharedValue(0),
  };

  // drag
  const pan = Gesture.Pan()
    .onStart(() => {
      saved.x.value = tx.value;
      saved.y.value = ty.value;
    })
    .onUpdate(e => {
      tx.value = saved.x.value + e.translationX;
      ty.value = saved.y.value + e.translationY;
    });

  // zoom
  const pinch = Gesture.Pinch()
    .onStart(() => { saved.s.value = scale.value; })
    .onUpdate(e => {
      const next = Math.min(
        maxScale,
        Math.max(minScale, saved.s.value * e.scale)
      );
      scale.value = next;
    });

  // rotation
  const rotate = Gesture.Rotation()
    .onStart(() => { saved.r.value = rot.value; })
    .onUpdate(e => {
      rot.value = saved.r.value + e.rotation;
    });

  // double tap to toggle zoom and reset pan/rotation when zooming out
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const to = scale.value > 1 ? 1 : 2;
      scale.value = withTiming(to, {
        duration: 220
      });
      if (to === 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        rot.value = withTiming(0);
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: tx.value
      },
      {
        translateY: ty.value
      },
      {
        scale: scale.value
      },
      {
        rotateZ: `${rot.value}rad`
      },
    ],
  }));

  // allow gestures to be recognized together (pan+pinch+rotate)
  const gesture = Gesture.Simultaneous(pan, pinch, rotate, doubleTap);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.flex, style]}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

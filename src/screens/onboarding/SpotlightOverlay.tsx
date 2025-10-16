import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import { useSpotlight } from './useSpotlight';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

const {
  width: SCREEN_W, height: SCREEN_H
} = Dimensions.get('window');

export const SpotlightOverlay: React.FC<{ accent?: string }> = ({
  accent = '#7965C1'
}) => {
  const {
    visible, current, currentTarget, next, prev, stop, activeIndex, steps
  } = useSpotlight();

  // hole state (plain React, no Reanimated)
  const [hole, setHole] = useState({
    x: SCREEN_W/2 - 100,
    y: SCREEN_H/2 - 28,
    w: 200,
    h: 56,
    r: 12,
    circle: false
  });

  useEffect(() => {
    if (!currentTarget || !current) return;
    const pad = current.padding ?? 8;
    const w = Math.max(0, currentTarget.width + pad * 2);
    const h = Math.max(0, currentTarget.height + pad * 2);
    const x = currentTarget.x - pad;
    const y = currentTarget.y - pad;
    const circle = current.shape === 'circle';
    const r = circle ? Math.max(w, h) / 2 : (current.cornerRadius ?? 12);
    setHole({
      x,
      y,
      w,
      h,
      r,
      circle
    });
  }, [currentTarget, current]);

  // auto place bubble above/below target
  const bubbleBox = useMemo(() => {
    if (!currentTarget) return {
      top: undefined as number|undefined,
      bottom: 28,
      left: 16,
      right: 16
    };
    const margin = 12;
    const spaceAbove = currentTarget.y;
    const spaceBelow = SCREEN_H - (currentTarget.y + currentTarget.height);
    if (spaceAbove > spaceBelow && spaceAbove > 120) {
      return {
        top: undefined,
        bottom: Math.max(SCREEN_H - currentTarget.y + margin, 28),
        left: 16,
        right: 16
      };
    }
    return {
      top: Math.max(currentTarget.y + currentTarget.height + margin, 28),
      bottom: undefined,
      left: 16,
      right: 16
    };
  }, [currentTarget]);
  const bubbleY = useSharedValue(10);
  const bubbleOpacity = useSharedValue(0);

  useEffect(() => {
    bubbleY.value = withTiming(0, {
      duration: 920
    });
    bubbleOpacity.value = withTiming(1, {
      duration: 920
    });
  }, [activeIndex, bubbleOpacity, bubbleY]);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{
      translateY: bubbleY.value
    }],
  }));
  if (!visible || !current) return null;

  const goNext = () => {
    if (activeIndex + 1 < steps.length) next();
    else stop();
  };

  const Hole = () => (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={SCREEN_W} height={SCREEN_H}>
        <Defs>
          <Mask id="holeMask">
            <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="#fff" />
            {hole.circle ? (
              <Circle cx={hole.x + hole.w/2} cy={hole.y + hole.h/2} r={Math.max(hole.w, hole.h)/2} fill="#000" />
            ) : (
              <Rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={hole.r} ry={hole.r} fill="#000" />
            )}
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="rgba(0,0,0,0.6)" mask="url(#holeMask)" />
      </Svg>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.fill}>
        {/* Tap anywhere to advance */}
        <Pressable style={styles.fill} onPress={goNext}>
          <Hole />
        </Pressable>

        {/* Bubble */}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={[styles.bubbleContainer, bubbleBox]}>
            <Animated.View style={[styles.bubble, bubbleAnimStyle]}>
              <Text style={styles.title}>{current.title}</Text>
              {!!current.description && <Text style={styles.desc}>{current.description}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity onPress={stop}><Text style={styles.secondary}>Skip</Text></TouchableOpacity>
                <View style={{
                  flex: 1
                }} />
                {activeIndex > 0 && (
                  <TouchableOpacity onPress={prev}><Text style={styles.secondary}>Back</Text></TouchableOpacity>
                )}
                <TouchableOpacity onPress={goNext}>
                  <Text style={[styles.primary, {
                    color: accent
                  }]}>{activeIndex + 1 === steps.length ? 'Got it' : 'Next'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.progress}>{`${activeIndex + 1}/${steps.length}`}</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1
  },
  bubbleContainer: {
    position: 'absolute'
  },
  bubble: {
    backgroundColor: 'rgba(20,20,26,0.95)',
    borderRadius: 16,
    padding: 16
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  secondary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8
  },
  primary: {
    fontSize: 15,
    fontWeight: '700'
  },
  progress: {
    marginTop: 8,
    alignSelf: 'flex-end',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)'
  },
});

import React, { useEffect, useRef } from 'react';
import { Pressable, Text, Animated, Easing } from 'react-native';
import { useStyles } from './styles';
type FABProps = {
  open: boolean;
  onToggle?: () => void;
  onPress?: (e?: any) => void;
  style?: any;
};
export default function FAB({
  open, onToggle, onPress
}: FABProps) {

  const s = useStyles();
  const rot = useRef(new Animated.Value(0)).current;

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });
  const handlePress = (e?: any) => {
    onPress?.(e);
    onToggle?.();
  };
  useEffect(() => {
    Animated.timing(rot, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, rot]);

  return (
    <Pressable onPress={handlePress} style={({
      pressed
    }) => [s.btn, pressed && s.btnPressed]} hitSlop={10}>
      <Animated.View style={{
        transform: [{
          rotate
        }]
      }}>
        <Text style={s.plus}>＋</Text>
      </Animated.View>
    </Pressable>
  );
}
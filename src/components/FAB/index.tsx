import React, { useEffect, useRef } from 'react';
import { Pressable, Text, Animated, Easing } from 'react-native';
import { useStyles } from './styles';

export default function FAB({
  open, onToggle
}: { open: boolean; onToggle: () => void }) {
  const s = useStyles();
  const rot = useRef(new Animated.Value(0)).current;

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });
  
  useEffect(() => {
    Animated.timing(rot, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, rot]);

  return (
    <Pressable onPress={onToggle} style={({
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
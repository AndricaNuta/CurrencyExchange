import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, Platform, Animated, Easing } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';

const useStyles = makeStyles(t => StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: 40,
    backgroundColor: t.colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    ...t.shadow.ios,
    ...t.shadow.android,
  },
  plus: {
    color: t.colors.surface,
    fontSize: 28,
    fontWeight: '800'
  },
  btn: {
    width: 60,
    height: 60,
    bottom: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.tint,
    ...t.shadow.ios,
    ...t.shadow.android,
  },
  btnPressed: {
    opacity: 0.9
  },
}));

export default function FAB({
  open, onToggle
}: { open: boolean; onToggle: () => void }) {
  const s = useStyles();
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rot, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, rot]);

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  return (
    <Pressable onPress={onToggle} style={({
      pressed
    }) => [s.btn, pressed && s.btnPressed]} hitSlop={10}>
      <Animated.View style={{
        transform: [{
          rotate
        }]
      }}>
        {/* Using plus glyph so 45deg rotation reads as an × */}
        <Text style={s.plus}>＋</Text>
      </Animated.View>
    </Pressable>
  );
}
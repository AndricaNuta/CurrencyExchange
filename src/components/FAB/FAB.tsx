import React from 'react';
import { Pressable, StyleSheet, Text, Platform } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';

const useStyles = makeStyles(t => StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: 20,
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
}));

export default function FAB({
  onPress, style,
}: { onPress: () => void; style?: any; }) {
  const s = useStyles();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: 'rgba(255,255,255,0.18)',
        borderless: true
      }}
      style={({
        pressed
      }) => [
        s.fab,
        style,
        pressed && Platform.OS === 'ios' && {
          transform: [{
            scale: 0.98
          }]
        },
      ]}
    >
      <Text style={s.plus}>＋</Text>
    </Pressable>
  );
}

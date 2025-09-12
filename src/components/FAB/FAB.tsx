import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

export default function FAB({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({
        pressed
      }) => [
        S.fab,
        style,
        pressed && {
          transform: [{
            scale: 0.98
          }]
        },
      ]}
    >
      <Text style={S.plus}>＋</Text>
    </Pressable>
  );
}
const S = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: 20,
    backgroundColor: '#6F5AE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 4,
  },
  plus: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 28
  },
});

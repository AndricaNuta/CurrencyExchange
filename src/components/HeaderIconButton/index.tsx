// ui/HeaderIconButton.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function HeaderIconButton({
  name,
  onPress,
  size = 22,
  color = '#000000',
}: { name: string; onPress: () => void; size?: number; color?: string }) {
  return (
    <TouchableOpacity
      hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }}
      onPress={onPress}
      style={{
        paddingHorizontal: 8
      }}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

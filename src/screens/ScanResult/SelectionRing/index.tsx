import React from 'react';
import { View } from 'react-native';

export function SelectionRing({
  width,
  height,
  radius,
  color,
  thickness = 10,
}: {
  width: number;
  height: number;
  radius: number;      
  color: string;
  thickness?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -thickness,
        top: -thickness,
        width: Math.round(width) + thickness * 2,
        height: Math.round(height) + thickness * 2,
        borderRadius: Math.max(0, radius + thickness),
        borderWidth: thickness,
        borderColor: color,
        zIndex: 2, 
      }}
    />
  );
}

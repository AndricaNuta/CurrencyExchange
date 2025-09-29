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
  radius: number;      // ring corner radius (match pill)
  color: string;
  thickness?: number;
}) {
  // Draw ABOVE the pill: put as a sibling after the pill in the tree.
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
        zIndex: 2, // sits above pill
      }}
    />
  );
}

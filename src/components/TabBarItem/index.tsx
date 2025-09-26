import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

const iconFor = (label: string) => {
  if (label === 'Converter') return '💱';
  if (label === 'History')   return '🕘';
  if (label === 'Settings')  return '⚙️';
  return '❖';
};

export const TabBarItem: React.FC<Props> = ({
  label, selected, onPress, style
}) => (
  <TouchableOpacity onPress={onPress} style={[S.tabItem, style]} activeOpacity={0.8}>
    <Text style={{
      fontSize: 18
    }}>{iconFor(label)}</Text>
    <Text style={[S.tabLabel, selected && S.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const S = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabLabel: {
    fontSize: 12,
    color: '#7d7b7d',
    marginTop: 4
  },
  tabLabelActive: {
    color: '#6F5AE6',
    fontWeight: '600'
  },
});

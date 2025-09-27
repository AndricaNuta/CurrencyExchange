import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';

const iconFor = (label: string) => label === 'Converter' ? '💱' :
  label === 'History' ? '🕘' : label === 'Settings' ? '⚙️' : '❖';

const useStyles = makeStyles(t => StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabLabel: {
    fontSize: 12,
    color: t.colors.muted,
    marginTop: 4
  },
  active: {
    color: t.colors.tint,
    fontWeight: '600'
  },
}));

export const TabBarItem = ({
  label, selected, onPress, style
}: { label: string;
    selected?: boolean;
    onPress: () => void; style?: any; }) => {
  const s = useStyles();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.tabItem, style]}
      activeOpacity={0.8}>
      <Text style={{
        fontSize: 18
      }}>{iconFor(label)}</Text>
      <Text style={[s.tabLabel, selected && s.active]}>{label}</Text>
    </TouchableOpacity>
  );
};

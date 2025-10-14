import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { makeStyles, useTheme as useAppTheme } from '../../theme/ThemeProvider';
import { Activity, Clock, Settings } from 'react-native-feather';
import { SwapIcon } from '../../../assets/icons/svg';
import { useStyles } from './styles';

const IconFor = ({
  label, color
}: { label: string; color: string }) => {
  switch (label) {
    case 'Converter':
      return  <SwapIcon width={20} height={20} fill={color}/>;
    case 'History':
      return <Clock width={20} height={20} color={color} />;
    case 'Settings':
      return <Settings width={20} height={20} color={color} />;
    default:
      return <Activity width={20} height={20} color={color} />;
  }
};

export const TabBarItem = ({
  label, selected, onPress, style
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: any;
}) => {
  const s = useStyles();
  const t = useAppTheme();
  const color = selected ? t.colors.tint : t.colors.muted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.tabItem, style]}
      activeOpacity={0.8}
    >
      <IconFor label={label} color={color} />
      <Text style={[s.tabLabel, selected && s.active]}>{label}</Text>
    </TouchableOpacity>
  );
};

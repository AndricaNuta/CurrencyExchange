import React from 'react';
import {Text, StyleSheet, View, Pressable } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { makeStyles, useTheme as useAppTheme } from '../../theme/ThemeProvider';
import { Activity, Clock, Settings } from 'react-native-feather';
import { SwapIcon } from '../../../assets/icons/svg';
import { AppTipContent } from '../TipComponents/AppTipContent'; // adjust if path differs

const IconFor = ({
  label, color
}: { label: string; color: string }) => {
  switch (label) {
    case 'Converter': return <SwapIcon width={20} height={20} fill={color} />;
    case 'History':   return <Clock width={20} height={20} color={color} />;
    case 'Settings':  return <Settings width={20} height={20} color={color} />;
    default:          return <Activity width={20} height={20} color={color} />;
  }
};

export const TabBarItem = ({
  label, selected, onPress, style,
  // NEW optional coachmark props
  coachmarkVisible,
  coachmarkPlacement = 'top',
  coachmarkOnClose,
  coachmarkTitle = 'Your saved pairs',
  coachmarkText  = 'Open Watchlist to see them with live updates.',
  coachmarkPrimaryLabel = 'Open Watchlist',
  coachmarkPrimaryPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: any;
  coachmarkVisible?: boolean;
  coachmarkPlacement?: 'top'|'bottom'|'left'|'right';
  coachmarkOnClose?: () => void;
  coachmarkTitle?: string;
  coachmarkText?: string;
  coachmarkPrimaryLabel?: string;
  coachmarkPrimaryPress?: () => void;
}) => {
  const s = useStyles();
  const t = useAppTheme();
  const color = selected ? t.colors.tint : t.colors.muted;

  const button = (
    <Pressable
      onPress={onPress}
      style={[s.tabItem, style]}
    >
      <IconFor label={label} color={color} />
      <Text style={[s.tabLabel, selected && s.active]}>{label}</Text>
    </Pressable>
  );

  if (!coachmarkVisible) return button;

  // Anchor tooltip INSIDE the button — keeps CurvedBottomBar layout intact
  return (
    <Tooltip
      isVisible
      placement={coachmarkPlacement}
      onClose={coachmarkOnClose}
      backgroundColor="rgba(0,0,0,0.20)"
      tooltipStyle={{
        backgroundColor: 'transparent',
        padding: 0
      }}
      content={
        <AppTipContent
          title={coachmarkTitle}
          text={coachmarkText}
          primaryLabel={coachmarkPrimaryLabel}
          onPrimaryPress={coachmarkPrimaryPress}
          arrowPosition={coachmarkPlacement}
        />
      }
    >
      <View>{button}</View>
    </Tooltip>
  );
};

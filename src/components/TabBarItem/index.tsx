import React, { useEffect, useRef } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useTheme as useAppTheme } from '../../theme/ThemeProvider';
import { Activity, Clock, Settings } from 'react-native-feather';
import { SwapIcon } from '../../../assets/icons/svg';
import { AppTipContent } from '../TipComponents/AppTipContent';
import { useStyles } from './styles';

import {FirstTimeTipPressable,
  FirstTimeTipPressableHandle,} from '../TipComponents/FirstTimeTipPressable';

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
    <Pressable onPress={onPress} style={[s.tabItem, style]}>
      <IconFor label={label} color={color} />
      <Text style={[s.tabLabel, selected && s.active]}>{label}</Text>
    </Pressable>
  );

  const tipRef = useRef<FirstTimeTipPressableHandle>(null);

  useEffect(() => {
    if (coachmarkVisible) tipRef.current?.open();
    else tipRef.current?.close();
  }, [coachmarkVisible]);

  // No coachmark requested → just render the button
  if (!coachmarkVisible) return button;

  // Coachmark: wrap the button with FirstTimeTipPressable.
  // We do NOT want first-tap interception here, so:
  // - blockActionOnFirstPress = false (let tab press still work)
  // - autoOpenOnFirstPress   = false (we open via ref)
  return (
    <FirstTimeTipPressable
      ref={tipRef}
      placement={coachmarkPlacement}
      backdrop="rgba(0,0,0,0.20)"
      blockActionOnFirstPress={false}
      autoOpenOnFirstPress={false}
      onPress={onPress}
      content={({
        close
      }) => (
        <AppTipContent
          title={coachmarkTitle}
          text={coachmarkText}
          primaryLabel={coachmarkPrimaryLabel}
          onPrimaryPress={() => {
            coachmarkPrimaryPress?.();
            close();
            coachmarkOnClose?.();
          }}
          arrowPosition={coachmarkPlacement}
        />
      )}
    >
      <View>{button}</View>
    </FirstTimeTipPressable>
  );
};

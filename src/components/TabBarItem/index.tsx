import React, { useEffect, useRef } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useTheme as useAppTheme } from '../../theme/ThemeProvider';
import { Activity} from 'react-native-feather';
import { AppTipContent } from '../TipComponents/AppTipContent';
import { useStyles } from './styles';
import {FirstTimeTipPressable,
  FirstTimeTipPressableHandle,} from '../TipComponents/FirstTimeTipPressable';

  type Props = {
    label: string;
    selected?: boolean;
    onPress: () => void;
    style?: any;
    renderIcon?: (color: string) => React.ReactNode;
    coachmarkVisible?: boolean;
    coachmarkPlacement?: 'top'|'bottom'|'left'|'right';
    coachmarkOnClose?: () => void;
    coachmarkTitle?: string;
    coachmarkText?: string;
    coachmarkPrimaryLabel?: string;
    coachmarkPrimaryPress?: () => void;
  };


export const TabBarItem = ({
  label, selected, onPress, style, renderIcon,
  coachmarkVisible, coachmarkPlacement='top', coachmarkOnClose,
  coachmarkTitle='Your saved pairs',
  coachmarkText='Open Watchlist to see them with live updates.',
  coachmarkPrimaryLabel='Open Watchlist',
  coachmarkPrimaryPress,
}: Props) => {
  const s = useStyles();
  const t = useAppTheme();
  const color = selected ? t.colors.tint : t.colors.muted;

  const icon = renderIcon
    ? renderIcon(color)
    : <Activity width={20} height={20} color={color} />;

  const button = (
    <Pressable onPress={onPress} style={[s.tabItem, style]}>
      {icon}
      <Text style={[s.tabLabel, selected && s.active]}>{label}</Text>
    </Pressable>
  );
  const tipRef = useRef<FirstTimeTipPressableHandle>(null);

  useEffect(() => {
    if (coachmarkVisible) tipRef.current?.open();
    else tipRef.current?.close();
  }, [coachmarkVisible]);

  if (!coachmarkVisible) return button;

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

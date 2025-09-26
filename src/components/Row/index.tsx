import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useStyles } from '../../screens/Settings/styles';
import { ChevronRight } from 'react-native-feather';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  title: string; subtitle?: string; right?: React.ReactNode;
  onPress?: () => void; iconLeft?: React.ReactNode; disabled?: boolean;
};
export const Row: React.FC<Props> = ({
  title, subtitle, right, onPress, iconLeft, disabled
}) => {
  const styles = useStyles(); const tkn = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled || !onPress} style={({
      pressed
    }) => [styles.row, pressed && onPress ? styles.rowPressed : null]}>
      {!!iconLeft && <View style={styles.leftIconWrap}>{iconLeft}</View>}
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right ?? <ChevronRight color={tkn.colors.muted} />}
    </Pressable>
  );
};

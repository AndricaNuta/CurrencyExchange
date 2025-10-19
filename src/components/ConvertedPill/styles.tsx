import { StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export const useStyles = makeStyles(t =>
  StyleSheet.create({
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor:
          t.scheme === 'dark'
            ? alpha(t.colors.card, 0.92)
            : alpha('#FFFFFF', 0.96),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 3
      },
      elevation: 3,
    },
    pilloverlay: {
      borderRadius: 18,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    number: {
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      color: t.colors.text,
    },
    unit: {
      marginLeft: 6,
      fontWeight: '600',
      color: alpha(t.colors.text, 0.55),
    },
  })
);
import { StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export const useStyles = makeStyles(t => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: alpha(t.colors.text, t.scheme === 'dark' ? 0.25 : 0.12)
    },
    cardWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 130,
      alignItems: 'center'
    },
    card: {
      width: 200,
      borderRadius: 16,
      backgroundColor: t.colors.card,
      ...t.shadow.ios,
      ...t.shadow.android,
      paddingVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12
    },
    rowPressed: {
      backgroundColor: t.scheme==='dark'
        ? alpha('#FFFFFF',0.06)
        : alpha('#111827',0.06)
    },
    iconWrap: {
      width: 26,
      alignItems: 'center',
      justifyContent: 'center'
    },
    text: {
      fontSize: 15,
      fontWeight: '600',
      color: t.colors.text
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.border,
      marginHorizontal: 15,
    },
  }));
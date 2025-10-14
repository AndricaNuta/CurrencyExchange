import { StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';

export const useStyles = makeStyles(t => StyleSheet.create({
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      bottom: 40,
      backgroundColor: t.colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      ...t.shadow.ios,
      ...t.shadow.android,
    },
    plus: {
      color: t.colors.surface,
      fontSize: 28,
      fontWeight: '800'
    },
    btn: {
      width: 60,
      height: 60,
      bottom: 30,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.tint,
      ...t.shadow.ios,
      ...t.shadow.android,
    },
    btnPressed: {
      opacity: 0.9
    },
  }));
  
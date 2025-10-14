import { StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';

export const useStyles = makeStyles(t => StyleSheet.create({
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      borderRadius: t.radius.pill
    },
    tabLabel: {
      fontSize: 12,
      color: t.colors.muted,
      marginTop: 4
    },
    active: {
      color: t.colors.tint,
      fontWeight: '700'
    },
  }));
  
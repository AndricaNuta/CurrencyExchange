import { makeStyles } from "../../../theme/ThemeProvider";
import { alpha } from "../../../theme/tokens";

export const useStyles = makeStyles((t) => ({
    column: {
      width: '100%',
  
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: t.spacing(3),
      overflow: 'hidden',
      marginBottom: 10,
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      overflow: 'hidden',
      backgroundColor: t.colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: t.spacing(4),
      paddingVertical: t.spacing(3),
    },
    col: {
      flex: 1,
      minWidth: 0
    },
    leftCol: {
      alignItems: 'flex-start'
    },
    rightCol: {
      alignItems: 'flex-end'
    },
  
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.scheme === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#111827', 0.06),
      borderRadius: 18,
      height: 32,
      gap: 6,
      maxWidth: '100%',
      paddingHorizontal: 10,
    },
    pillCode: {
      fontSize: 13,
      fontWeight: '700',
      color: t.colors.text
    },
  
    input: {
      marginTop: t.spacing(1.5),
      width: '100%',
      minWidth: 0,
      paddingVertical: 0,
      fontSize: 18,
      paddingHorizontal: 5,
      fontWeight: '700',
      color: t.colors.text,
    },
    swapBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      flexShrink: 0,
      alignSelf: 'center',
      marginHorizontal: 8,
    },
  
    convertedWrap: {
      marginTop: t.spacing(1.5),
      minWidth: 0,
      paddingHorizontal: 5,
      maxWidth: '100%',
      alignItems: 'flex-end',
    },
    converted: {
      fontSize: 18,
      fontWeight: '800',
      color: t.colors.text
    },
    sub: {
      fontSize: 12,
      color: t.colors.subtext,
      left:10,
    },
    error: {
      fontSize: 12,
      color: t.colors.danger,
      marginTop: 6
    },
  }));
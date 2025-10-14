import { StyleSheet } from "react-native";
import { makeStyles } from "../../theme/ThemeProvider";
import { alpha } from "../../theme/tokens";

export const useStyles = makeStyles((t) => StyleSheet.create({
    screen: {
      flex: 1,
      paddingTop:60,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.colors.bg,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: t.colors.text
    },
    sub: {
      color: t.colors.subtext
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.04) : alpha('#111827', 0.03),
    },
    sortTxt: {
      color: t.colors.text,
      fontWeight: '700',
      fontSize: 12
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    },
    emptyTxt: {
      color: t.colors.subtext,
      textAlign: 'center'
    },
    list: {
      paddingBottom: 24
    },
  }));
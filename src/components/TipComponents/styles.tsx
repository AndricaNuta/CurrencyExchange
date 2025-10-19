import { StyleSheet } from "react-native";
import { makeStyles } from "../../theme/ThemeProvider";

export const useStyles = makeStyles((t) =>
  StyleSheet.create({
    container: {
      borderRadius: t.radius.xl,
      overflow: 'hidden',
    },
    inner: {
      paddingHorizontal: t.spacing(4),
      paddingVertical: t.spacing(3.5),
      borderRadius: t.radius.xl,
      borderWidth: 1,
    },
    title: {
      marginBottom: t.spacing(1.5),
      letterSpacing: 0.15,
    },
    text: {
    },
    actions: {
      flexDirection: 'row',
      gap: t.spacing(2.5),
      marginTop: t.spacing(3),
    },
    primaryBtn: {
      paddingHorizontal: t.spacing(3.5),
      paddingVertical: t.spacing(2.5),
      borderRadius: t.radius.md,
    },
    primaryLabel: {
      fontWeight: '800',
    },
    secondaryBtn: {
      paddingHorizontal: t.spacing(3.5),
      paddingVertical: t.spacing(2.5),
      borderRadius: t.radius.md,
      borderWidth: 1,
    },
    secondaryLabel: {
      fontWeight: '700',
    },
  })
);

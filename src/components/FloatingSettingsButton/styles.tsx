import { StyleSheet } from "react-native";
import { makeStyles } from "../../theme/ThemeProvider";

export const useStyles = makeStyles((_t) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 4
      },
      elevation: 8,
    },
    pressable: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
);
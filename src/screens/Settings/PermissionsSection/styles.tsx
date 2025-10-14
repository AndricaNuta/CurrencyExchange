import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
    card: {
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth
    },
    header: {
      fontSize: 18,
      fontWeight: '800'
    },
    caption: {
      marginTop: 4,
      marginBottom: 10,
      fontSize: 13
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 12
    },
    circle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: 16,
      fontWeight: '700'
    },
    sub: {
      fontSize: 12,
      marginTop: 2
    },
    sep: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      marginVertical: 6
    },
  });
  
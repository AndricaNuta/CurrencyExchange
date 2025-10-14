import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    centerWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    card: {
      borderRadius: 22,               
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 8
      },
      elevation: 6,
  
    },
    accent: {
      height: 10,
      width: '100%',
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 20,
      fontWeight: '800'
    },
    close: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10
    },
    closeTxt: {
      fontSize: 15,
      fontWeight: '700'
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      width: '100%'
    },
    body: {
      fontSize: 15,
      lineHeight: 22.5
    },
    actions: {
      padding: 12,
      paddingTop: 4,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    ghostBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    ghostTxt: {
      fontSize: 15,
      fontWeight: '700'
    },
    primaryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    primaryTxt: {
      fontSize: 15,
      fontWeight: '800'
    },
    link: {
      textDecorationLine: 'underline'
    },
  });
  
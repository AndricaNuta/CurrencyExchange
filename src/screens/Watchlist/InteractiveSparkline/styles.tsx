import { StyleSheet } from "react-native";
import { makeStyles } from "../../../theme/ThemeProvider";

export const useStyles = makeStyles(() =>
  StyleSheet.create({
    root: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12 },
    overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  })
);
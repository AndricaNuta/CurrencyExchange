import { StyleSheet } from "react-native";
import { makeStyles } from "../../../theme/ThemeProvider";
import { alpha } from "../../../theme/tokens";

export const useStyles = makeStyles((t) =>
StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: alpha('#000', 0.35)
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  sheet: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: t.colors.card,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    padding: 14,
    maxHeight: '86%',
    ...t.shadow.ios,
    ...t.shadow.android,
  },

  // Header
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1
  },
  bellBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(t.colors.tint, 0.14),
    borderWidth: 1,
    borderColor: t.colors.tint,
  },
  titleWrap: {
    gap: 4,
    flexShrink: 1
  },
  title: {
    fontWeight: '800',
    fontSize: 16,
    color: t.colors.text
  },
  pairPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.06) : alpha('#111827', 0.05),
  },
  flag: {
    fontSize: 16
  },
  code: {
    fontWeight: '800',
    color: t.colors.text,
    fontSize: 12
  },
  arrow: {
    color: t.colors.subtext,
    fontWeight: '800'
  },

  // Body
  body: {
    marginTop: 12,
    gap: 12
  },
  callout: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.03) : alpha('#111827', 0.02),
    gap: 10,
  },
  calloutTitle: {
    color: t.colors.subtext,
    fontWeight: '800',
    fontSize: 12
  },
  primary: {
    height: 40,
    padding:10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.tint,
  },
  primaryTxt: {
    color: '#fff',
    fontWeight: '700'
  },

  summaryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.04) : alpha('#111827', 0.02),
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTxt: {
    color: t.colors.text,
    fontWeight: '800',
    fontSize: 12
  },

  fieldCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.02) : alpha('#111827', 0.02),
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    color: t.colors.subtext,
    fontWeight: '800',
    fontSize: 12,
    flexShrink: 1
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.colors.card,
  },
  stepTxt: {
    color: t.colors.text,
    fontWeight: '800',
    fontSize: 12
  },

  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.colors.card,
    textAlign: 'center',
    color: t.colors.text,
    fontWeight: '800',
    fontSize: 16,
    paddingVertical: 0,
  },

  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start'
  },
  moreTxt: {
    color: t.colors.subtext,
    fontWeight: '800',
    fontSize: 12
  },

  // Footer
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  link: {
    color: t.colors.subtext,
    fontWeight: '800'
  },
  disabled: {
    opacity: 0.45
  },
})
);

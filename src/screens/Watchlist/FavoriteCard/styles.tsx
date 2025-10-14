import { StyleSheet } from "react-native";
import { makeStyles } from "../../../theme/ThemeProvider";
import { alpha } from "../../../theme/tokens";

export const useStyles = makeStyles((t) =>
  StyleSheet.create({
    card: { marginHorizontal: 16, marginTop: 12, borderRadius: t.radius.xl, backgroundColor: t.colors.card, borderWidth: 1, borderColor: t.colors.border, padding: 12, ...t.shadow.ios, ...t.shadow.android },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pairPill: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.08) : alpha('#111827', 0.06),
      borderRadius: t.radius.pill, paddingHorizontal: 14, height: 36,
      borderWidth: 1, borderColor: alpha(t.colors.border, 0.9), maxWidth: '70%',
    },
    flagBig: { fontSize: 22 },
    codeTxt: { fontSize: 14, fontWeight: '700', color: t.colors.text },
    arrowTxt: { color: t.colors.subtext, fontWeight: '800' },
    rightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconCircle: {
      width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.06) : alpha('#111827', 0.04),
    },
    iconActive: { borderColor: t.colors.tint, backgroundColor: alpha(t.colors.tint, 0.16) },
    rateBlock: { marginTop: 8, alignItems: 'center', paddingHorizontal: 8 },
    rateStrong: { fontSize: t.typography.numStrongLarge, fontWeight: t.typography.numStrong as any, color: t.colors.text, includeFontPadding: false },
    hint: { marginTop: 2, fontSize: 12, color: t.colors.subtext },

    chartSection: { marginTop: 8 },
    chartBox: { overflow: 'hidden', width: '100%', borderRadius: 12, alignSelf: 'stretch', position: 'relative' },
    innerChart: { width: '100%', height: '100%' },

    rangeOverlay: { position: 'absolute', right: 6, top: 6, flexDirection: 'row', gap: 8, pointerEvents: 'box-none' },
    rangeChip: (active: boolean) => ({
      height: 26, paddingHorizontal: 10,
      borderRadius: 999, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: active ? t.colors.tint : alpha(t.colors.border, 0.9),
      backgroundColor: active ? alpha(t.colors.tint, 0.14) : (t.scheme === 'dark' ? alpha('#fff', 0.03) : alpha('#111827', 0.02)),
    }),
    rangeTxt: (active: boolean) => ({ color: active ? t.colors.tint : t.colors.text, fontWeight: '700', fontSize: 12 }),

    axisRow: { width: 320, flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', marginTop: 6 },
    axisTxt: { color: t.colors.subtext, fontSize: 11 },

    statsRow: { marginTop: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    statPill: {
      height: 26, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: alpha(t.colors.border, 0.7),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.02) : alpha('#111827', 0.02),
    },
    statTxt: { color: t.colors.text, fontWeight: '700', fontSize: 12 },

    row: { flexDirection: 'row', gap: 10, marginTop: 10 },
    tinyCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: alpha(t.colors.border, 0.9), backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.03) : alpha('#111827', 0.02), padding: 12, gap: 6 },
    tinyLabel: { color: t.colors.subtext, fontSize: 12, fontWeight: '700' },
    tinyValue: { color: t.colors.text, fontWeight: '800', fontSize: 14 },

    hoverLine: { position: 'absolute', top: 0, bottom: 0, width: 1 },
  })
);

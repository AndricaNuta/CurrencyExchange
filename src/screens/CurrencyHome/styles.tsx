import { StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.bg,
    padding: t.spacing(5),
    paddingTop: t.spacing(22),
  },

  // Card & blocks
  card: {
    backgroundColor: t.colors.card,
    borderRadius: 24,
    ...t.shadow.ios,
    ...t.shadow.android,
    overflow: 'visible',
  },
  settingsAnchor: {
    position: 'absolute',
    right: 16,        // ⬅️ match where your FloatingSettingsButton renders
    bottom: 48,       // ⬅️ align with bottomGuardPx or your button’s offset
    width: 56,        // ⬅️ roughly the size of your floating button
    height: 56,
    borderRadius: 28,
    // backgroundColor: 'rgba(255,0,0,0.1)', // uncomment briefly to verify alignment
  },
  block: {
    padding: t.spacing(5),
  },
  blockTop: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  blockBottom: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: t.spacing(7),
  },

  // Headers / labels
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockLabel: {
    fontSize: 15,
    color: t.colors.subtext,
    fontWeight: '600',
  },

  // Inputs / values
  bigInput: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 8,
    paddingVertical: 0,
    color: t.colors.text,
  },
  bigConverted: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 8,
    color: t.colors.text,
  },
  subAmount: {
    marginTop: 6,
    color: t.colors.subtext,
    fontSize: 14,
  },

  // Pills
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      t.scheme === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#111827', 0.06),
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 36,
    gap: 8,
  },
  pillFlag: {
    fontSize: 16
  },
  pillCode: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.text
  },

  // Swap button
  swapCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: t.colors.surface,
    borderRadius: 40,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    ...t.shadow.ios,
    ...t.shadow.android,
  },

  // Rate row
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: t.spacing(3.5),
    paddingHorizontal: t.spacing(1.5),
  },
  rateText: {
    color: t.colors.subtext
  },
  rateStrong: {
    color: t.colors.success,
    fontWeight: '800'
  },
  timePill: {
    backgroundColor:
      t.scheme === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#111827', 0.06),
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeTxt: {
    fontSize: 12,
    color: t.colors.subtext
  },

  // Misc (OCR, errors)
  pickBtn: {
    marginTop: t.spacing(3),
    paddingVertical: t.spacing(3),
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    alignItems: 'center',
    backgroundColor: t.colors.surface,
  },
  pickTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: t.colors.text
  },
  err: {
    marginTop: 8,
    color: t.colors.danger
  },

  detectCard: {
    marginTop: t.spacing(3),
    padding: t.spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    borderRadius: 12,
    backgroundColor: t.colors.surface,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: t.colors.text
  },
  candRow: {
    paddingVertical: 6
  },
  candMain: {
    fontSize: 16,
    fontWeight: '600',
    color: t.colors.text
  },
  candLine: {
    fontSize: 12,
    color: t.colors.subtext
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: t.colors.subtext
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dim: {
    marginTop: 8,
    color: t.colors.subtext
  },
  error: {
    color: t.colors.danger,
    marginTop: 8
  },
}));

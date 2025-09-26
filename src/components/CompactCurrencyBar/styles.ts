import { makeStyles } from "../../theme/ThemeProvider";
import { alpha } from "../../theme/tokens";

export const useStyles = makeStyles(t => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.card,
    borderRadius: t.radius.lg,
    padding: t.spacing(2),
    gap: t.spacing(2),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing(1.5),
    paddingHorizontal: t.spacing(3),
    height: 36,
    borderRadius: 18,
    backgroundColor: t.scheme === 'dark'
      ? alpha('#FFFFFF', 0.08)
      : alpha('#111827', 0.06),
  },
  flag: {
    fontSize: 16
  },
  code: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.text
  },
  swap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));
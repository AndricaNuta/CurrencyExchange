import { StyleSheet } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.bg,
    paddingTop: t.spacing(15+3),
    paddingHorizontal: t.spacing(4),
  },
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: 16,
  paddingBottom: 8,
  gap: 12, 
},
  screenTitle: {
    fontSize: t.typography.h1.size,
    fontWeight: t.typography.h1.weight as any,
    lineHeight: t.typography.h1.lineHeight,
    color: t.colors.text,
  },
  sectionHeader: {
    fontSize: t.typography.caption.size,
    fontWeight: t.typography.caption.weight as any,
    letterSpacing: t.typography.caption.letterSpacing,
    textTransform: 'uppercase',
    color: t.colors.subtext,
    marginTop: t.spacing(4),
    marginBottom: t.spacing(2),
  },
  card: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    paddingHorizontal: t.spacing(3),
    overflow: 'hidden',
    ...t.shadow.ios,
    ...t.shadow.android,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: t.spacing(2),
    borderRadius: t.radius.md,
  },
  rowPressed: {
    opacity: 0.6
  },
  leftIconWrap: {
    marginRight: t.spacing(2.5)
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: t.colors.text
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: t.colors.subtext
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.border,
    marginHorizontal: -t.spacing(3),
  },
  circleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageIcon: {
    backgroundColor: alpha(t.colors.tint, t.scheme === 'dark' ? 0.18 : 0.12)
  },
  fromIcon:     {
    backgroundColor: alpha('#7C3AED', t.scheme === 'dark' ? 0.18 : 0.12)
  },
  toIcon:       {
    backgroundColor: alpha('#EA580C', t.scheme === 'dark' ? 0.18 : 0.12)
  },
  notifIcon:    {
    backgroundColor: alpha(t.colors.danger, t.scheme === 'dark' ? 0.18 : 0.12)
  },
  darkIcon:     {
    backgroundColor: t.scheme === 'dark' ? alpha('#FFFFFF', 0.10) : t.colors.icon
  },

  flex: {
    flex: 1
  },
}));

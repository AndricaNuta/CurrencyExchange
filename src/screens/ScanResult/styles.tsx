import { StyleSheet, Dimensions } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

const {
  width: W, height: H
} = Dimensions.get('window');

export const useScanStyles = makeStyles(t => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.colors.bg
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.tint
  },
  seeAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: alpha(t.colors.text, 0.06),
  },
  seeAllTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.text,
  },
  detectedHeader: {
    paddingHorizontal: t.spacing(3),
    paddingVertical: 8,
    //backgroundColor: t.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: alpha(t.colors.text, 0.08),
  },
  detectedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: alpha(t.colors.text, 0.85),
  },
  stickyHeader: {
    backgroundColor: t.colors.surface,
    paddingBottom: 8
  },
  topHudWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 30,
    paddingHorizontal: 30
  },
  topHud: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topHudDim: {
    opacity: 0.85
  },

  eyeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
  },
  eyeChipInactive: {
    backgroundColor: t.scheme==='dark' ? alpha('#000',0.35) : alpha('#FFFFFF',0.60),
  },
  eyeChipActive: {
    backgroundColor: t.scheme==='dark' ? alpha('#000',0.10) : alpha('#FFFFFF',0.80)
  },
  eyeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.text
  },

  imageWrap: {
    flex: 1
  },
  img: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: W,
    height: H
  },

  rowSelected: {
    backgroundColor: alpha(t.colors.highlightFill, 0.08),
    borderRadius:20,
  },

  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.scheme==='dark' ? alpha('#000',0.35) : alpha('#FFFFFF',0.80),
    alignItems: 'center',
    justifyContent: 'center',
    ...t.shadow.ios,
    ...t.shadow.android,
  },
  closeText: {
    color: t.scheme==='dark' ? t.colors.text : '#000',
    fontSize: 18,
    fontWeight: '700'
  },

  handle: {
    backgroundColor: t.colors.sheetHandle
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8
  },
  sheetBackground: {
    backgroundColor: t.colors.surface
  },

  fadeBehind: {
    opacity: 0.94,
    transform: [{
      scale: 0.995
    }]
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
    color: t.colors.text
  },
  row: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: t.spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,              // << light line
    borderBottomColor: alpha(t.colors.text, 0.08),
  },
  itemTitle: {
    fontSize: 16.5,
    fontWeight: '600',
    color: t.colors.text,
  },
  priceWrap: {
    flexGrow: 1,
    alignItems: 'flex-end',                                   // << right aligned
  },
  meta: {
    fontSize: 12,
    color: t.colors.subtext,
    marginTop: 2
  },
  hint: {
    fontSize: 12,
    color: t.colors.muted,
    marginTop: 10,
    textAlign: 'center'
  },
}));

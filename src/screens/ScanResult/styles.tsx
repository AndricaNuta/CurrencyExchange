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
  detectedHeader: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  detectedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: t.colors.text
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
    borderColor: alpha(t.colors.tint, 0.9),
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: alpha(t.colors.tint, 0.10),
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.border
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: t.colors.text,
    left: 5
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

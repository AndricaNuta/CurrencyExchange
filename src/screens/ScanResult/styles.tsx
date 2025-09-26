// styles.ts
import { Dimensions, StyleSheet } from 'react-native';

const {
  width: W, height: H
} = Dimensions.get('window');

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // image & overlays
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
    height: H,
  },
  overlayBox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#FFC83D',
    borderRadius: 10,
  },
  pillCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // close button
  close: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },

  // bottom sheet
  handle: {
    backgroundColor: '#D1D5DB'
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  sheetBackground: {
    backgroundColor: '#FFF'
  },
  fadeBehind: {
    opacity: 0.94,
    transform: [{
      scale: 0.995
    }],
  },

  // converter row
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',

  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    overflow:'scroll',
    left:5,
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});

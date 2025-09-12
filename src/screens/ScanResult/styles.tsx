import { Dimensions, StyleSheet } from 'react-native';

const {
  width: W, height: H
} = Dimensions.get('window');

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000'
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
  close: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },

  handle: {
    backgroundColor: '#D1D5DB'
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8
  },

  /* Mini converter */
  miniRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  miniTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  miniLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333'
  },
  swapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  swapTxt: {
    fontSize: 16,
    color: '#3C3F44'
  },

  miniInputs: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fromBox: {
    flex: 1,
    paddingRight: 8
  },
  toBox: {
    flex: 1,
    paddingLeft: 8,
    alignItems: 'flex-end'
  },
  ccy: {
    fontSize: 12,
    color: '#6A6F7A',
    fontWeight: '700'
  },
  toCcy: {
    textAlign: 'right'
  },
  miniInput: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    paddingVertical: 0,
    marginTop: 2,
  },
  miniConverted: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginTop: 2,
    textAlign: 'right',
  },
  arrow: {
    marginHorizontal: 6,
    fontSize: 18,
    color: '#9AA0A6'
  },
  rateNote: {
    marginTop: 6,
    fontSize: 12,
    color: '#8A8F98'
  },

  /* Detected list */
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  main: {
    fontSize: 16,
    fontWeight: '700'
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center'
  },

  /* Converted pill */
  convPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F7',
    alignItems: 'flex-end',
  },
  convMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111'
  },
  convMeta: {
    fontSize: 10,
    color: '#6A6F7A'
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111'
  },
  itemSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
});

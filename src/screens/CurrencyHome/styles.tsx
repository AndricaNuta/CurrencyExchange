import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F7F9', padding: 20, paddingTop: 48 },
    card: {
      backgroundColor: '#FFFFFF', borderRadius: 24,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
      elevation: 3, overflow: 'visible',
    },
    block: { padding: 20 },
    blockTop: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    blockBottom: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: 28 },
    blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    blockLabel: { fontSize: 15, color: '#6A6F7A', fontWeight: '600' },
    bigInput: { fontSize: 40, fontWeight: '800', marginTop: 8, paddingVertical: 0, color: '#111' },
    bigConverted: { fontSize: 40, fontWeight: '800', marginTop: 8, color: '#111' },
    subAmount: { marginTop: 6, color: '#8A8F98', fontSize: 14 },
    pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F7', borderRadius: 22, paddingHorizontal: 14, height: 36, gap: 8 },
    pillFlag: { fontSize: 16 }, pillCode: { fontSize: 14, fontWeight: '700', color: '#111' }, pillChevron: { fontSize: 14, color: '#6A6F7A' },
    swapCircle: {
      position: 'absolute', alignSelf: 'center', top: '45%', backgroundColor: '#FFFFFF',
      borderRadius: 40, width: 64, height: 64, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: '#F0F1F4', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    swapArrow: { fontSize: 20, color: '#3C3F44' },
    rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 6 },
    rateText: { color: '#6A6F7A' },
    rateStrong: { color: '#2AAE2A', fontWeight: '800' },
    timePill: { backgroundColor: '#EEEEF2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    timeTxt: { fontSize: 12, color: '#6A6F7A' },
  
    pickBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
    pickTxt: { fontSize: 16, fontWeight: '600' },
    err: { marginTop: 8, color: '#c00' },
    detectCard: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 12, backgroundColor: '#fff' },
    subTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    candRow: { paddingVertical: 6 },
    candMain: { fontSize: 16, fontWeight: '600' },
    candLine: { fontSize: 12, color: '#666' },
    hint: { marginTop: 8, fontSize: 12, color: '#666' },
  
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    dim: { marginTop: 8, color: '#6A6F7A' },
      error: { color: '#B00020', marginTop: 8 },
  
  });

  
export const previewStyles = StyleSheet.create({
    wrap: { marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontWeight: '700' },
    link: { color: '#6A6F7A' },
    row: { paddingVertical: 6 },
    main: { fontWeight: '600' },
    meta: { color: '#777', fontSize: 12, marginTop: 2 },
  });

export const popoverStyles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.12)' },
    cardWrap: { position: 'absolute', left: 0, right: 0, bottom: 110, alignItems: 'center' },
    card: {
      width: 260, borderRadius: 16, backgroundColor: '#fff',
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 10 }, elevation: 6,
      paddingVertical: 6,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    rowPressed: { backgroundColor: '#F6F7FA' },
    icon: { width: 26, fontSize: 18 },
    text: { fontSize: 15, fontWeight: '600' },
  });

export const fabStyles = StyleSheet.create({
    fab: {
      width: 56, height: 56, borderRadius: 28, backgroundColor: '#6F5AE6',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4,
    },
    plus: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 28 },
  });

export const pickerStyles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.25)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '80%',
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    grabber: {
      alignSelf: 'center',
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#E5E7EB',
      marginTop: 8,
      marginBottom: 8,
    },
    title: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
    search: {
      backgroundColor: '#F3F4F7',
      marginHorizontal: 16,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    flag: { fontSize: 18, marginRight: 10 },
    rowPrimary: { fontSize: 16, fontWeight: '700', color: '#111' },
    rowSecondary: { fontSize: 12, color: '#6A6F7A', marginTop: 2 },
    chev: { fontSize: 20, color: '#B8BCC6', marginLeft: 8 },
    close: {
      alignSelf: 'center',
      marginTop: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    closeTxt: { color: '#6A6F7A', fontWeight: '600' },
  });
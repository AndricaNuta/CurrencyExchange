import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F7F8FA',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    overflow: 'hidden',
    // soft shadow iOS
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    // soft shadow Android
    elevation: 2,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECEFF3',
    marginHorizontal: -12,
  },

  // “Info” card (dark like the second screenshot)
  cardDark: {
    backgroundColor: '#0A1A12', // deep green-black
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chevronDark: {
    color: 'rgba(255,255,255,0.7)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  // left icon in settings rows
  leftIconWrap: { marginRight: 10 },

  circleIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // BottomSheet
  sheetTitle: { fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 12, color: '#111827' },
  searchWrap: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8, color: '#111827' },
  sheetRow: {
    minHeight: 52,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFF3',
  },
  sheetRowPressed: { opacity: 0.5 },
  sheetRowText: { fontSize: 16, color: '#111827' },
});

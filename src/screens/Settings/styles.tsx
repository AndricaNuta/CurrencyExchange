import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  leftIconWrap: {
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECEFF3',
    marginHorizontal: -12,
  },
  circleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageIcon: {
    backgroundColor: '#EFF6FF',
  },
  fromIcon: {
    backgroundColor: '#F5F3FF',
  },
  toIcon: {
    backgroundColor: '#FFF7ED',
  },
  notifIcon: {
    backgroundColor: '#FEF2F2',
  },
  darkIcon: {
    backgroundColor: '#111827',
  },
  flex: {
    flex: 1,
  },
});

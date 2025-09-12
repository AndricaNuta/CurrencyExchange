import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchWrap: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
  },
  row: {
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
  },
  rowPressed: {
    opacity: 0.5,
  },
  left: {
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  flex: {
    flex: 1
  },
  flatlistContainerStyle:{
    paddingBottom: 16,
    flexGrow: 1
  },
  emptyListView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  emptyListText: {
    color: '#6B7280'
  }
});

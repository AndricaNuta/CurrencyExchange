import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    padding: 16,
    paddingTop: 48
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800'
  },
  link: {
    color: '#6A6F7A'
  },
  row: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  main: {
    fontWeight: '700'
  },
  meta: {
    color: '#777',
    fontSize: 12,
    marginTop: 4
  },
  emptyMessage: {
    color: '#777'
  },
  itemSeparator: {
    height: 8
  }
});

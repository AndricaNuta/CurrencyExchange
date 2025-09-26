import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export const usePickerStyles = makeStyles((t) => ({
  header: {
    paddingHorizontal: t.spacing(4),
    paddingBottom: t.spacing(2),
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.text,
    marginBottom: t.spacing(2)
  },
  searchWrap: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: t.scheme==='dark' ? alpha('#FFFFFF',0.08) : alpha('#111827',0.06),
    borderRadius: 12,
    paddingHorizontal: t.spacing(3),
    height: 44,
  },
  searchInput: {
    flex:1,
    marginLeft: t.spacing(2),
    color: t.colors.text
  },
  row: {
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:t.spacing(4),
    paddingVertical:t.spacing(3)
  },
  rowPressed: {
    opacity: 0.6
  },
  left: {
    marginRight: t.spacing(3)
  },
  rowLabel: {
    flex:1,
    color: t.colors.text,
    fontSize: 16
  },
  flex: {
    flex:1
  },
  flatlistContainerStyle: {
    paddingBottom: t.spacing(6),
    backgroundColor: t.colors.surface
  },
  emptyListView: {
    alignItems:'center',
    padding: t.spacing(6)
  },
  emptyListText: {
    color: t.colors.subtext
  },
}));

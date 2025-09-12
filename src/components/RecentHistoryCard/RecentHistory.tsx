import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export type HistoryItem = {
  id: string; when: number;
  from: string; to: string;
  amount: number; converted: number; rate: number;
  source?: 'live'|'camera'|'gallery';
};

export default function RecentHistory({
  items, onPressItem, onClear,
}: {
  items: HistoryItem[]; onPressItem: (it: HistoryItem) => void; onClear: () => void;
}) {
  if (!items.length) return null;
  return (
    <View style={S.wrap}>
      <View style={S.header}>
        <Text style={S.title}>Recent</Text>
        <Pressable onPress={onClear}><Text style={S.clear}>Clear</Text></Pressable>
      </View>
      <FlatList
        data={items.slice(0, 5)}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPressItem(item)} style={S.row}>
            <Text style={S.main}>{item.amount.toFixed(2)} {item.from} → {item.converted.toFixed(2)} {item.to}</Text>
            <Text style={S.meta}>{new Date(item.when).toLocaleString()} • {item.rate.toFixed(4)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
const S = StyleSheet.create({
  wrap: { marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontWeight: '700' },
  clear: { color: '#6A6F7A' },
  row: { paddingVertical: 6 },
  main: { fontWeight: '600' },
  meta: { color: '#777', fontSize: 12, marginTop: 2 },
});

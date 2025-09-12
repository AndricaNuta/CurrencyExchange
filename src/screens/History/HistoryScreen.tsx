import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { clearHistory } from '../../redux/slices/historySlice';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';

export default function HistoryScreen() {
  const items = useSelector((s: RootState) => s.history.items);
  const dispatch = useDispatch();
  const nav = useNavigation<any>();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        {!!items.length && (
          <Pressable onPress={() => dispatch(clearHistory())}>
            <Text style={styles.link}>Clear all</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={{ color: '#777' }}>No history yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => nav.navigate('Converter', {
              preset: { from: item.from, to: item.to, amount: item.amount },
            })}
          >
            <Text style={styles.main}>
              {item.amount.toFixed(2)} {item.from} → {item.converted.toFixed(2)} {item.to}
            </Text>
            <Text style={styles.meta}>
              {new Date(item.when).toLocaleString()} • {item.rate.toFixed(4)} ({item.source ?? 'manual'})
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

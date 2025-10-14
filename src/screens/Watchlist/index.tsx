import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import  FavoriteCard  from './FavoriteCard';
import { ChevronDown } from 'react-native-feather';
import { useStyles } from './styles';

export default function WatchlistScreen() {
  const s = useStyles();
  const items = useSelector((st: RootState) => st.favorites.items);
  const pairs = Object.values(items);
  const [sort, setSort] = useState<'az' | 'recent'>('recent');

  const sorted = useMemo(() => {
    const arr = [...pairs];
    if (sort === 'az') arr.sort((a, b) => a.id.localeCompare(b.id));
    else arr.sort((a, b) => b.id.localeCompare(a.id));
    return arr;
  }, [pairs, sort]);

  if (!pairs.length) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyTxt}>
          No favorites yet.{'\n'}⭐ Star a pair in Converter to track it here.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Watchlist</Text>
          <Text style={s.sub}>{pairs.length} tracked {pairs.length === 1 ? 'pair' : 'pairs'}</Text>
        </View>
        <Pressable onPress={() => setSort(prev => (prev === 'az' ? 'recent' : 'az'))} style={s.sortBtn}>
          <Text style={s.sortTxt}>{sort === 'az' ? 'A → Z' : 'Recent'}</Text>
          <ChevronDown width={14} height={14} color="#999" />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={s.list}
        data={sorted}
        keyExtractor={(it) => it.id}
        renderItem={({
          item
        }) => (
          <FavoriteCard
            base={item.base}
            quote={item.quote}
            defaultAmount={1000}       // optional: show a 1000 BASE preview (match your converter preset)
            // sparkline={[] }          // plug real history here when you have it
          />
        )}
      />
    </View>
  );
}

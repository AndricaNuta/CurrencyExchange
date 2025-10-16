import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import  FavoriteCard  from './FavoriteCard';
import { ChevronDown } from 'react-native-feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { AppTipContent } from '../../components/TipComponents/AppTipContent';
import { getBool, setBool } from '../../services/mmkv';

const useStyles = makeStyles((t) => StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop:60,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: t.colors.text
  },
  sub: {
    color: t.colors.subtext
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: alpha(t.colors.border, 0.9),
    backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.04) : alpha('#111827', 0.03),
  },
  sortTxt: {
    color: t.colors.text,
    fontWeight: '700',
    fontSize: 12
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  emptyTxt: {
    color: t.colors.subtext,
    textAlign: 'center'
  },
  list: {
    paddingBottom: 24
  },
}));

export default function WatchlistScreen() {
  const s = useStyles();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const fromTour = !!route.params?.fromTour;
  const items = useSelector((st: RootState) => st.favorites.items);
  const pairs = Object.values(items);
  const [sort, setSort] = useState<'az' | 'recent'>('recent');

  const sorted = useMemo(() => {
    const arr = [...pairs];
    if (sort === 'az') arr.sort((a, b) => a.id.localeCompare(b.id));
    else arr.sort((a, b) => b.id.localeCompare(a.id));
    return arr;
  }, [pairs, sort]);
  const [showStep3, setShowStep3] = useState(fromTour);
  useEffect(() => {
    if (getBool('tour_watchlist_step3')) {
      setShowStep3(true);
      setBool('tour_watchlist_step3', false); // clear so it doesn't retrigger
    }
  }, []);

  const openCreateAlert = () => {
    setShowStep3(false);
    // open your alerts UI here (sheet/modal/nav)
  };
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
          item, index
        }) => {
          const card = (
            <FavoriteCard
              base={item.base}
              quote={item.quote}
              defaultAmount={1000} />
          );

          if (index !== 0) return card; // tip only on first card

          return (
            <Tooltip
              isVisible={showStep3}
              placement="bottom"
              onClose={() => setShowStep3(false)}
              backgroundColor="rgba(0,0,0,0.20)"
              tooltipStyle={{
                backgroundColor: 'transparent',
                padding: 0
              }}
              content={
                <AppTipContent
                  title="Stay in the loop"
                  text="Create an alert to get notified when this rate moves."
                  primaryLabel="Create alert"
                  onPrimaryPress={openCreateAlert}
                  arrowPosition="bottom"
                />
              }
            >
              {card}
            </Tooltip>
          );
        }}
      />
    </View>
  );
}
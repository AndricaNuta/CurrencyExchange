import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import FavoriteCard from './FavoriteCard';
import { ChevronDown } from 'react-native-feather';
import { useRoute } from '@react-navigation/native';
import { AppTipContent } from '../../components/TipComponents/AppTipContent';
import { getBool, setBool } from '../../services/mmkv';
import { OB_KEYS } from '../onboarding/onboardingKeys';
import {FirstTimeTipPressable,
  FirstTimeTipPressableHandle} from '../../components/TipComponents/FirstTimeTipPressable';
import { useStyles } from './styles';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetPairRateQuery } from '../../services/currencyApi';
import AlertsCenterModal from './AlertsCenterModal';


function FirstCardWithTip({
  base, quote, show, onCreateAlert,
}: {
  base: string;
  quote: string;
  show: boolean;
  onCreateAlert: (base: string, quote: string) => void;
}) {
  const tipRef = useRef<FirstTimeTipPressableHandle>(null);
  const [recalcKey, setRecalcKey] = useState(0);
  useEffect(() => {
    if (show) requestAnimationFrame(() => tipRef.current?.open());
    else tipRef.current?.close();
  }, [show]);

  return (
    <FirstTimeTipPressable
      ref={tipRef}
      recalcKey={recalcKey}
      placement="bottom"
      interceptPress={false}
      showAnchorClone
      displayInsets={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      childContentSpacing={10}
      backdrop="rgba(0,0,0,0.20)"
      content={({
        close
      }) => (
        <AppTipContent
          title="Get notified"
          text="Create an alert when the rate changes."
          primaryLabel="Create alert"
          onPrimaryPress={() => {
            close();                                     // close tip first
            requestAnimationFrame(() => onCreateAlert(base, quote)); // then open modal at parent
          }}
          arrowPosition="bottom"
        />
      )}
    >
      <FavoriteCard base={base} quote={quote} />
    </FirstTimeTipPressable>
  );
}

export default function WatchlistScreen() {
  const s = useStyles();
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
    if (getBool(OB_KEYS.WATCHLIST_STEP3)) {
      setBool(OB_KEYS.WATCHLIST_STEP3, false);   // consume flag
      requestAnimationFrame(() => setShowStep3(true));
    }
  }, []);
  const [alertsFor, setAlertsFor] = useState<{ base: string; quote: string } | null>(null);

  const {
    data: selectedPair
  } = useGetPairRateQuery(
    alertsFor ? {
      from: alertsFor.base,
      to: alertsFor.quote
    } : skipToken as any,
    {
      skip: !alertsFor
    } );
  const currentRate = selectedPair?.rate;
  const openCreateAlert = (b: string, q: string) => {
    setShowStep3(false);
    setAlertsFor({
      base: b,
      quote: q
    });
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
          if (index === 0) {
            return (
              <FirstCardWithTip
                base={item.base}
                quote={item.quote}
                show={showStep3}
                onCreateAlert={openCreateAlert}  // 👈 pass parent opener
              />
            );
          }
          return (
            <FavoriteCard
              base={item.base}
              quote={item.quote} />
          );
        }}
      />
      <AlertsCenterModal
        visible={!!alertsFor}
        onClose={() => setAlertsFor(null)}
        base={alertsFor?.base}
        quote={alertsFor?.quote}
        currentRate={currentRate}
        hasAlerts={false}  // or compute from store if you want
        step={0.01}
        decimals={4}
      />
    </View>
  );
}

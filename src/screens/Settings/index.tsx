import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { SUPPORTED, LanguageCode } from '../../localization/languages';
import { useGetCurrenciesQuery } from '../../services/currencyApi';

// icons
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type RowProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  iconLeft?: React.ReactNode;
  disabled?: boolean;
};
const Row = ({ title, subtitle, right, onPress, iconLeft, disabled }: RowProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || !onPress}
    style={({ pressed }) => [styles.row, pressed && onPress ? styles.rowPressed : null]}
  >
    {!!iconLeft && <View style={styles.leftIconWrap}>{iconLeft}</View>}
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>
    {right ?? <Feather name="chevron-right" size={22} color="#9CA3AF" />}
  </Pressable>
);

function useSortedCurrencyList(map?: Record<string, string>) {
  return React.useMemo(
    () =>
      map
        ? Object.entries(map)
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.code.localeCompare(b.code))
        : [],
    [map]
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language?.split('-')[0] ?? 'en') as LanguageCode;

  // demo local state — wire to Redux/AsyncStorage later
  const [rateAlerts, setRateAlerts] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [from, setFrom] = React.useState('USD');
  const [to, setTo] = React.useState('EUR');

  const { data: currencies } = useGetCurrenciesQuery();
  const currencyList = useSortedCurrencyList(currencies);

  // bottom sheets
  const langRef = React.useRef<BottomSheet>(null);
  const fromRef = React.useRef<BottomSheet>(null);
  const toRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ['45%', '80%'], []);

  const [langQuery, setLangQuery] = React.useState('');
  const [fromQuery, setFromQuery] = React.useState('');
  const [toQuery, setToQuery] = React.useState('');

  const open  = (ref: React.RefObject<BottomSheet>) => ref.current?.snapToIndex(1);
  const close = (ref: React.RefObject<BottomSheet>) => ref.current?.close();

  const languageName = (code: LanguageCode) => t(`langs.${code}`);
  const currencyName = (code?: string) => (code && currencies?.[code]) ? `${currencies[code]} (${code})` : code ?? '';

  const filteredLangs = React.useMemo(
    () => SUPPORTED.filter(c => languageName(c).toLowerCase().includes(langQuery.toLowerCase())),
    [langQuery, i18n.language]
  );

  const filterCurrencies = (q: string) =>
    currencyList.filter(({ code, name }) =>
      code.toLowerCase().includes(q.toLowerCase()) || name.toLowerCase().includes(q.toLowerCase())
    );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t('settings.title')}</Text>

      {/* General */}
      <Text style={styles.sectionHeader}>{t('settings.section.general')}</Text>
      <View style={styles.card}>
        <Row
          title={t('settings.language')}
          subtitle={languageName(currentLang)}
          onPress={() => open(langRef)}
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="globe" size={16} color="#2563EB" />
            </View>
          }
        />
      </View>

      {/* Default Currencies */}
      <Text style={styles.sectionHeader}>{t('settings.section.defaults')}</Text>
      <View style={styles.card}>
        <Row
          title={t('settings.defaultFrom')}
          subtitle={currencyName(from)}
          onPress={() => open(fromRef)}
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: '#F5F3FF' }]}>
              <Feather name="arrow-up-right" size={16} color="#7C3AED" />
            </View>
          }
        />
        <View style={styles.divider} />
        <Row
          title={t('settings.defaultTo')}
          subtitle={currencyName(to)}
          onPress={() => open(toRef)}
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: '#FFF7ED' }]}>
              <Feather name="arrow-down-left" size={16} color="#EA580C" />
            </View>
          }
        />
      </View>

      {/* Notifications */}
      <Text style={styles.sectionHeader}>{t('settings.section.notifications')}</Text>
      <View style={styles.card}>
        <Row
          title={t('settings.exchangeRateAlerts')}
          right={
            <Switch
              value={rateAlerts}
              onValueChange={setRateAlerts}
              thumbColor="#fff"
              trackColor={{ false: '#E6E8EC', true: '#ff3b30' }}
            />
          }
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="bell" size={16} color="#EF4444" />
            </View>
          }
        />
      </View>

      {/* Appearance */}
      <Text style={styles.sectionHeader}>{t('settings.section.appearance')}</Text>
      <View style={styles.card}>
        <Row
          title={t('settings.darkMode')}
          right={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor="#fff"
              trackColor={{ false: '#E6E8EC', true: '#34C759' }}
            />
          }
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: '#111827' }]}>
              <Feather name="moon" size={16} color="#fff" />
            </View>
          }
        />
      </View>

      {/* Info (dark card style) */}
      <Text style={styles.sectionHeader}>{t('settings.section.info')}</Text>
      <View style={[styles.card, styles.cardDark]}>
        <Row
          title={t('settings.about')}
          onPress={() => {}}
          right={<Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />}
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Feather name="info" size={16} color="rgba(255,255,255,0.9)" />
            </View>
          }
        />
        <View style={[styles.divider, styles.dividerDark]} />
        <Row
          title={t('settings.version')}
          right={<Text style={styles.infoValue}>1.0.0</Text>}
          disabled
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <MaterialCommunityIcons name="tag-outline" size={16} color="rgba(255,255,255,0.9)" />
            </View>
          }
        />
        <View style={[styles.divider, styles.dividerDark]} />
        <Row
          title={t('settings.support')}
          onPress={() => {}}
          right={<Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />}
          iconLeft={
            <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Feather name="life-buoy" size={16} color="rgba(255,255,255,0.9)" />
            </View>
          }
        />
      </View>

      {/* ---------- LANGUAGE SHEET (with search + icons) ---------- */}
      <BottomSheet ref={langRef} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{t('settings.language')}</Text>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#6B7280" />
            <BottomSheetTextInput
              value={langQuery}
              onChangeText={setLangQuery}
              placeholder={t('common.search') || 'Search'}
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {filteredLangs.map(code => {
            const selected = currentLang === code;
            return (
              <Pressable
                key={code}
                style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
                onPress={() => {
                  i18n.changeLanguage(code);
                  close(langRef);
                  setLangQuery('');
                }}
              >
                <View style={[styles.circleIcon, { backgroundColor: '#EFF6FF', marginRight: 12 }]}>
                  <Feather name="globe" size={16} color="#2563EB" />
                </View>
                <Text style={[styles.sheetRowText, { flex: 1 }]}>{languageName(code)}</Text>
                {selected ? <Feather name="check" size={18} color="#0EA5E9" /> : null}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* ---------- FROM CURRENCY SHEET ---------- */}
      <BottomSheet ref={fromRef} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{t('settings.defaultFrom')}</Text>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#6B7280" />
            <BottomSheetTextInput
              value={fromQuery}
              onChangeText={setFromQuery}
              placeholder={t('common.search') || 'Search'}
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
          </View>

          {filterCurrencies(fromQuery).map(({ code, name }) => (
            <Pressable
              key={`from-${code}`}
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={() => {
                setFrom(code);
                close(fromRef);
                setFromQuery('');
              }}
            >
              <View style={[styles.circleIcon, { backgroundColor: '#F5F3FF', marginRight: 12 }]}>
                <Feather name="arrow-up-right" size={16} color="#7C3AED" />
              </View>
              <Text style={[styles.sheetRowText, { flex: 1 }]}>{`${name} (${code})`}</Text>
              {from === code ? <Feather name="check" size={18} color="#7C3AED" /> : null}
            </Pressable>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* ---------- TO CURRENCY SHEET ---------- */}
      <BottomSheet ref={toRef} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{t('settings.defaultTo')}</Text>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#6B7280" />
            <BottomSheetTextInput
              value={toQuery}
              onChangeText={setToQuery}
              placeholder={t('common.search') || 'Search'}
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
          </View>

          {filterCurrencies(toQuery).map(({ code, name }) => (
            <Pressable
              key={`to-${code}`}
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={() => {
                setTo(code);
                close(toRef);
                setToQuery('');
              }}
            >
              <View style={[styles.circleIcon, { backgroundColor: '#FFF7ED', marginRight: 12 }]}>
                <Feather name="arrow-down-left" size={16} color="#EA580C" />
              </View>
              <Text style={[styles.sheetRowText, { flex: 1 }]}>{`${name} (${code})`}</Text>
              {to === code ? <Feather name="check" size={18} color="#EA580C" /> : null}
            </Pressable>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

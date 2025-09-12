import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { SUPPORTED, LanguageCode } from '../../localization/languages';
import { useGetCurrenciesQuery } from '../../services/currencyApi';
import { PickerBottomSheet } from '../../components/PickerBottomSheet';
import {ChevronRight,
  Globe,
  ArrowUpLeft,
  ArrowDownLeft,
  Bell,
  Moon,
  Check,
  ArrowUpRight,} from 'react-native-feather';
import { useSortedCurrencyList } from '../../utils/useSortedCurrencyList';
import { useSelector, useDispatch } from 'react-redux';
import { setDefaultFrom, setDefaultTo } from '../../redux/slices/settingsSlice';

type RowProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  iconLeft?: React.ReactNode;
  disabled?: boolean;
};
const Row = React.memo(function Row({
  title,
  subtitle,
  right,
  onPress,
  iconLeft,
  disabled,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({
        pressed
      }) => [
        styles.row,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      {!!iconLeft && <View style={styles.leftIconWrap}>{iconLeft}</View>}
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right ?? <ChevronRight color="#9CA3AF" />}
    </Pressable>
  );
});

export default function SettingsScreen() {
  const {
    t, i18n
  } = useTranslation();
  const currentLang = (i18n.language?.split('-')[0] ?? 'en') as LanguageCode;

  const [rateAlerts, setRateAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const dispatch = useDispatch();
  const {
    defaultFrom: from, defaultTo: to
  } = useSelector(s => s.settings);

  const {
    data: currencies
  } = useGetCurrenciesQuery();
  const currencyList = useSortedCurrencyList(currencies);

  const [langQuery, setLangQuery] = useState('');
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  const languageName = useCallback(
    (code: LanguageCode) => t(`settings.languageList.${code}`),
    [t],
  );
  const currencyName = useCallback(
    (code?: string) =>
      code && currencies?.[code] ? `${currencies[code]} (${code})` : code ?? '',
    [currencies],
  );

  const filteredLangs = useMemo(
    () =>
      SUPPORTED.filter(c =>
        languageName(c).toLowerCase().includes(langQuery.toLowerCase()),
      ),
    [languageName, langQuery],
  );

  const fromFiltered = useMemo(
    () =>
      currencyList.filter(
        ({
          code, name
        }) =>
          code.toLowerCase().includes(fromQuery.toLowerCase()) ||
          name.toLowerCase().includes(fromQuery.toLowerCase()),
      ),
    [currencyList, fromQuery],
  );
  const toFiltered = useMemo(
    () =>
      currencyList.filter(
        ({
          code, name
        }) =>
          code.toLowerCase().includes(toQuery.toLowerCase()) ||
          name.toLowerCase().includes(toQuery.toLowerCase()),
      ),
    [currencyList, toQuery],
  );

  const languageItems = useMemo(
    () =>
      filteredLangs.map(code => ({
        key: code,
        label: t(`settings.languageList.${code}`),
        left: <Globe color="#2563EB" />,
        right: currentLang === code ? <Check color="#0EA5E9" /> : undefined,
      })),
    [filteredLangs, currentLang, t],
  );
  const fromItems = useMemo(
    () =>
      fromFiltered.map(({
        code, name
      }) => ({
        key: code,
        label: `${name} (${code})`,
        left: <ArrowUpLeft color="#7C3AED" />,
        right: from === code ? <Check color="#7C3AED" /> : undefined,
      })),
    [fromFiltered, from],
  );
  const toItems = useMemo(
    () =>
      toFiltered.map(({
        code, name
      }) => ({
        key: code,
        label: `${name} (${code})`,
        left: <ArrowDownLeft color="#EA580C" />,
        right: to === code ? <Check color="#EA580C" /> : undefined,
      })),
    [toFiltered, to],
  );

  type Mode = 'lang' | 'from' | 'to' | null;
  const modalRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<Mode>(null);
  const isOpenRef = useRef<boolean>(false);
  const pendingModeRef = useRef<Mode>(null);

  const presentMode = useCallback(
    (next: Exclude<Mode, null>) => {
      if (!isOpenRef.current) {
        setMode(next);
        modalRef.current?.present();
        isOpenRef.current = true;
        return;
      }
      if (mode === next) {
        modalRef.current?.present();
        return;
      }
      pendingModeRef.current = next;
      modalRef.current?.dismiss();
    },
    [mode],
  );

  const handleDismiss = useCallback(() => {
    isOpenRef.current = false;
    const next = pendingModeRef.current as Exclude<Mode, null> | null;
    if (next) {
      pendingModeRef.current = null;
      setMode(next);
      requestAnimationFrame(() => {
        modalRef.current?.present();
        isOpenRef.current = true;
      });
    } else {
      setMode(null);
    }
  }, []);

  const titleForMode =
    mode === 'lang'
      ? t('settings.language')
      : mode === 'from'
        ? t('settings.defaultFrom')
        : mode === 'to'
          ? t('settings.defaultTo')
          : '';
  const itemsForMode =
    mode === 'lang' ? languageItems : mode === 'from' ? fromItems : toItems;

  const searchForMode =
    mode === 'lang'
      ? {
        value: langQuery,
        set: setLangQuery,
        autoCapitalize: 'none' as const
      }
      : mode === 'from'
        ? {
          value: fromQuery,
          set: setFromQuery,
          autoCapitalize: 'characters' as const,
        }
        : mode === 'to'
          ? {
            value: toQuery,
            set: setToQuery,
            autoCapitalize: 'characters' as const,
          }
          : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t('settings.title')}</Text>

      {/* General */}
      <Text style={styles.sectionHeader}>{t('settings.section.general')}</Text>
      <View style={styles.card}>
        <Row
          title={t('settings.language')}
          subtitle={languageName(currentLang)}
          onPress={() => presentMode('lang')}
          iconLeft={
            <View style={[styles.circleIcon, styles.languageIcon]}>
              <Globe color="#2563EB" />
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
          onPress={() => presentMode('from')}
          iconLeft={
            <View style={[styles.circleIcon, styles.fromIcon]}>
              <ArrowUpRight color="#7C3AED" />
            </View>
          }
        />
        <View style={styles.divider} />
        <Row
          title={t('settings.defaultTo')}
          subtitle={currencyName(to)}
          onPress={() => presentMode('to')}
          iconLeft={
            <View style={[styles.circleIcon, styles.toIcon]}>
              <ArrowDownLeft color="#EA580C" />
            </View>
          }
        />
      </View>

      {/* Notifications */}
      <Text style={styles.sectionHeader}>
        {t('settings.section.notifications')}
      </Text>
      <View style={styles.card}>
        <Row
          title={t('settings.exchangeRateAlerts')}
          right={
            <Switch
              value={rateAlerts}
              onValueChange={setRateAlerts}
              thumbColor="#fff"
              trackColor={{
                false: '#E6E8EC',
                true: '#ff3b30'
              }}
            />
          }
          iconLeft={
            <View style={[styles.circleIcon, styles.notifIcon]}>
              <Bell color="#EF4444" />
            </View>
          }
        />
      </View>

      {/* Appearance */}
      <Text style={styles.sectionHeader}>
        {t('settings.section.appearance')}
      </Text>
      <View style={styles.card}>
        <Row
          title={t('settings.darkMode')}
          right={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor="#fff"
              trackColor={{
                false: '#E6E8EC',
                true: '#34C759'
              }}
            />
          }
          iconLeft={
            <View style={[styles.circleIcon, styles.darkIcon]}>
              <Moon color="#fff" />
            </View>
          }
        />
      </View>

      {/* Modal (one instance) */}
      <PickerBottomSheet
        ref={modalRef}
        title={titleForMode}
        items={itemsForMode}
        search={searchForMode}
        onSelect={(key) => {
          if (mode === 'lang') {
            i18n.changeLanguage(key as LanguageCode);
            setLangQuery('');
          }
          if (mode === 'from') {
            dispatch(setDefaultFrom(key));
            setFromQuery('');
          }
          if (mode === 'to') {
            dispatch(setDefaultTo(key));
            setToQuery('');
          }
          modalRef.current?.dismiss();
        }}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

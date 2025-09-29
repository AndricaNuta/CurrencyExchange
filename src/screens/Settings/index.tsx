import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Switch, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from './styles';
import { SUPPORTED, LanguageCode } from '../../localization/languages';
import { useGetCurrenciesQuery } from '../../services/currencyApi';
import { PickerBottomSheet } from '../../components/PickerBottomSheet';
import {ChevronRight,
  Globe,
  ArrowDownLeft,
  Bell,
  Moon,
  Check,
  ArrowUpRight,} from 'react-native-feather';
import { useSortedCurrencyList } from '../../utils/useSortedCurrencyList';
import { useSelector, useDispatch } from 'react-redux';
import { setDefaultFrom, setDefaultTo, setThemePreference } from '../../redux/slices/settingsSlice';
import { useTheme } from '../../theme/ThemeProvider';
import { currencyFlag } from '../../utils/currencyFlag';
import { useCurrencyPicker } from '../../hooks/useCurrencyPicker';
import { LegalDialog } from './LegalModal.tsx';
import { PermissionsCard } from './PermissionsSection/index.tsx';
import { aboutText, privacyPolicyText, termsOfUseText } from '../../constants/text.ts';

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
  const styles = useStyles();
  const tkn = useTheme();
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
      {right ?? <ChevronRight color={tkn.colors.muted} />}
    </Pressable>
  );
});

export default function SettingsScreen() {
  const {
    t, i18n
  } = useTranslation();
  const currentLang = (i18n.language?.split('-')[0] ?? 'en') as LanguageCode;
  const styles = useStyles();
  const tkn = useTheme();
  const [rateAlerts, setRateAlerts] = useState(true);
  const dispatch = useDispatch();
  const {
    defaultFrom: from,
    defaultTo: to,
    themePreference
  } = useSelector((s: any) => s.settings);
  const isDark = themePreference === 'dark';
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const onToggleDark = useCallback((v: boolean) => {
    dispatch(setThemePreference(v ? 'dark' : 'light'));
  }, [dispatch]);

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

  const languageItems = useMemo(() => filteredLangs.map(code => ({
    key: code,
    label: t(`settings.languageList.${code}`),
    left: <Globe color={tkn.colors.tint} />,
    right: currentLang === code ? <Check color={tkn.colors.tint} /> : undefined,
  })), [filteredLangs, currentLang, t, tkn.colors.tint]);

  const fromItems = useMemo(
    () => fromFiltered.map(({
      code, name
    }) => ({
      key: code,
      label: `${name} (${code})`,
      left: <Text>{currencyFlag(code)}</Text>,
      right: from === code ? <Check color={tkn.colors.tint} /> : undefined,
    })),
    [fromFiltered, from, tkn.colors.tint]
  );

  const toItems = useMemo(
    () => toFiltered.map(({
      code, name
    }) => ({
      key: code,
      label: `${name} (${code})`,
      left: <Text>{currencyFlag(code)}</Text>,
      right: to === code ? <Check color={tkn.colors.tint} /> : undefined,
    })),
    [toFiltered, to, tkn.colors.tint]
  );

  const {
    modalRef,
    mode,
    presentMode,
    handleDismiss
  } = useCurrencyPicker();

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
              <Globe color={tkn.colors.tint} />
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
            <View style={[styles.circleIcon, {
              backgroundColor: tkn.colors[tkn.roles.settings.defaultFromIcon.bg]
            }]}>
              <ArrowUpRight
                color={tkn.colors[tkn.roles.settings.defaultFromIcon.fg]} />
            </View>
          }
        />
        <View style={styles.divider} />
        <Row
          title={t('settings.defaultTo')}
          subtitle={currencyName(to)}
          onPress={() => presentMode('to')}
          iconLeft={
            <View style={[styles.circleIcon, {
              backgroundColor: tkn.colors[tkn.roles.settings.defaultToIcon.bg]
            }]}>
              <ArrowDownLeft
                color={tkn.colors[tkn.roles.settings.defaultToIcon.fg]} />
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
              thumbColor={tkn.colors.surface}
              trackColor={{
                false: tkn.colors.muted,
                true: tkn.colors.success
              }}

            />
          }
          iconLeft={
            <View style={[styles.circleIcon, {
              backgroundColor: tkn.colors[tkn.roles.settings.notifIcon.bg]
            }]}>
              <Bell color={tkn.colors[tkn.roles.settings.notifIcon.fg]} />
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
              value={isDark}
              onValueChange={onToggleDark}
              thumbColor={tkn.colors.surface}
              trackColor={{
                false: tkn.colors.muted,
                true: tkn.colors.success
              }}

            />
          }
          iconLeft={
            <View style={[styles.circleIcon, {
              backgroundColor: tkn.colors[tkn.roles.settings.darkModeIcon.bg]
            }]}>
              <Moon color={tkn.colors[tkn.roles.settings.darkModeIcon.fg]} />
            </View>
          }
        />
      </View>
      <Text style={styles.sectionHeader}>{t('Legal')}</Text>
      <View style={styles.card}>
        <Row
          title={t('Privacy Policy')}
          onPress={() =>setShowPrivacy(true)}
        />
        <View style={styles.divider} />
        <Row
          title={t('Terms of Use')}
          onPress={() =>setShowTerms(true)}
        />
        <View style={styles.divider} />

        <Row title={t('About')} onPress={() => setShowAbout(true)} />

      </View>
 {/*
      <Text style={styles.sectionHeader}>{t('Permissions')}</Text>
     <PermissionsCard />*/}
      <LegalDialog
        visible={showPrivacy}
        title="Privacy Policy"
        content={privacyPolicyText}
        onClose={() => setShowPrivacy(false)}
      />
      <LegalDialog
        visible={showTerms}
        title="Terms of Use"
        content={termsOfUseText}
        onClose={() => setShowTerms(false)}
      />
      <LegalDialog
        visible={showAbout}
        title="About"
        content={aboutText}
        onClose={() => setShowAbout(false)}
      />
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

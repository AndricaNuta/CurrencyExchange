// screens/Watchlist/AlertsCenterModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {Modal, View, Text, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { setAlerts } from '../../redux/slices/favoritesSlice';
import { Bell, ChevronDown } from 'react-native-feather';
import { currencyFlag } from '../../utils/currencyFlag';

type Props = {
  visible: boolean;
  onClose: () => void;
  base: string;
  quote: string;
  currentRate?: number;
  hasAlerts?: boolean;
  step?: number;     // default 0.01
  decimals?: number; // default 4
};

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: alpha('#000', 0.35)
    },
    sheetWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 18
    },
    sheet: {
      width: '100%',
      borderRadius: 18,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      padding: 14,
      maxHeight: '86%',
      ...t.shadow.ios,
      ...t.shadow.android,
    },

    // Header
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    headLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1
    },
    bellBadge: {
      width: 32,
      height: 32,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: alpha(t.colors.tint, 0.14),
      borderWidth: 1,
      borderColor: t.colors.tint,
    },
    titleWrap: {
      gap: 4,
      flexShrink: 1
    },
    title: {
      fontWeight: '800',
      fontSize: 16,
      color: t.colors.text
    },
    pairPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      height: 28,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.06) : alpha('#111827', 0.05),
    },
    flag: {
      fontSize: 16
    },
    code: {
      fontWeight: '800',
      color: t.colors.text,
      fontSize: 12
    },
    arrow: {
      color: t.colors.subtext,
      fontWeight: '800'
    },

    // Body
    body: {
      marginTop: 12,
      gap: 12
    },
    callout: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.03) : alpha('#111827', 0.02),
      gap: 10,
    },
    calloutTitle: {
      color: t.colors.subtext,
      fontWeight: '800',
      fontSize: 12
    },
    primary: {
      height: 40,
      padding:10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.tint,
    },
    primaryTxt: {
      color: '#fff',
      fontWeight: '700'
    },

    summaryChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      height: 28,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.04) : alpha('#111827', 0.02),
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTxt: {
      color: t.colors.text,
      fontWeight: '800',
      fontSize: 12
    },

    fieldCard: {
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.02) : alpha('#111827', 0.02),
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    label: {
      color: t.colors.subtext,
      fontWeight: '800',
      fontSize: 12,
      flexShrink: 1
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.colors.card,
    },
    stepTxt: {
      color: t.colors.text,
      fontWeight: '800',
      fontSize: 12
    },

    input: {
      flex: 1,
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.colors.card,
      textAlign: 'center',
      color: t.colors.text,
      fontWeight: '800',
      fontSize: 16,
      paddingVertical: 0,
    },

    moreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start'
    },
    moreTxt: {
      color: t.colors.subtext,
      fontWeight: '800',
      fontSize: 12
    },

    // Footer
    footer: {
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    link: {
      color: t.colors.subtext,
      fontWeight: '800'
    },
    disabled: {
      opacity: 0.45
    },
  })
);

const toNum = (s: string) => {
  const v = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};
const fmt = (v?: number | null, d = 4) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : '—';

export default function AlertsCenterModal({
  visible, onClose, base, quote, currentRate, hasAlerts, step: stepProp = 0.01, decimals = 4,
}: Props) {
  const s = useStyles();
  const t = useTheme();
  const dispatch = useDispatch();

  const saved = useSelector((st: RootState) => st.favorites.items[`${base}-${quote}`]?.alerts);
  const step = stepProp;

  const [enabled, setEnabled] = useState(!!hasAlerts);
  const [above, setAbove] = useState('');
  const [below, setBelow] = useState('');
  const [showPct, setShowPct] = useState(false);
  const [pct, setPct] = useState('');

  // Seed when opening
  useEffect(() => {
    if (!visible) return;
    const hadRules = Boolean(saved && (saved.above != null || saved.below != null || saved.onChangePct != null));
    setEnabled(hadRules || !!hasAlerts);

    if (hadRules) {
      setAbove(saved?.above != null ? saved!.above.toFixed(decimals) : '');
      setBelow(saved?.below != null ? saved!.below.toFixed(decimals) : '');
      setPct(saved?.onChangePct != null ? String(saved!.onChangePct) : '');
    } else if (currentRate != null) {
      setAbove((currentRate + step).toFixed(decimals));
      setBelow((currentRate - step).toFixed(decimals));
      setPct('');
    } else {
      setAbove(''); setBelow(''); setPct('');
    }
  }, [visible, saved, hasAlerts, currentRate, decimals, step]);

  const turnOnWithDefaults = () => {
    setEnabled(true);
    if (currentRate != null) {
      setAbove((currentRate + step).toFixed(decimals));
      setBelow((currentRate - step).toFixed(decimals));
    }
  };

  const nudge = (which: 'above' | 'below', dir: 1 | -1) => {
    const cur = toNum(which === 'above' ? above : below) ?? currentRate ?? 0;
    const next = Number((cur + dir * step).toFixed(decimals));
    (which === 'above' ? setAbove : setBelow)(String(next));
  };

  const summary = useMemo(() => {
    if (!enabled) return 'Alerts off';
    const a = toNum(above); const b = toNum(below); const p = toNum(pct);
    const parts: string[] = [];
    if (a != null) parts.push(`↑ ${a.toFixed(decimals)}`);
    if (b != null) parts.push(`↓ ${b.toFixed(decimals)}`);
    if (p != null) parts.push(`${p}%`);
    return parts.length ? parts.join('   •   ') : 'No rules yet';
  }, [enabled, above, below, pct, decimals]);

  const save = () => {
    if (!enabled) {
      dispatch(setAlerts({
        base,
        quote,
        alerts: {
          above: null,
          below: null,
          onChangePct: null
        }
      }));
      onClose();
      return;
    }
    const a = toNum(above); const b = toNum(below); const p = toNum(pct);
    dispatch(setAlerts({
      base,
      quote,
      alerts: {
        above: a != null ? Number(a.toFixed(decimals)) : null,
        below: b != null ? Number(b.toFixed(decimals)) : null,
        onChangePct: p != null ? p : null,
        notifyOncePerCross: true,
        minIntervalMinutes: 60,
      },
    }));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.select({
        ios: 'padding',
        android: undefined
      })} style={s.overlay}>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            {/* Header */}
            <View style={s.head}>
              <View style={s.headLeft}>
                <View style={s.bellBadge}><Bell width={16} height={16} color={t.colors.tint} /></View>
                <View style={s.titleWrap}>
                  <Text style={s.title}>Rate alerts</Text>
                  <View style={s.pairPill}>
                    <Text style={s.flag}>{currencyFlag(base)}</Text>
                    <Text style={s.code}>{base}</Text>
                    <Text style={s.arrow}>→</Text>
                    <Text style={s.flag}>{currencyFlag(quote)}</Text>
                    <Text style={s.code}>{quote}</Text>
                  </View>
                </View>
              </View>
              {/* no tiny toggle here anymore */}
            </View>

            <ScrollView contentContainerStyle={s.body} bounces={false}>
              {!enabled && (
                <View style={s.callout}>
                  <Text style={s.calloutTitle}>Alerts are off</Text>
                  <Pressable onPress={turnOnWithDefaults} style={s.primary}>
                    <Text style={s.primaryTxt}>Turn on with defaults (±{step})</Text>
                  </Pressable>
                </View>
              )}

              <View style={s.summaryChip}><Text style={s.summaryTxt}>{summary}</Text></View>

              {/* ABOVE */}
              <View style={[s.fieldCard, !enabled && s.disabled]}>
                <View style={s.labelRow}><Text style={s.label}>When it goes above ({quote})</Text></View>
                <View style={s.controlsRow}>
                  <Pressable disabled={!enabled} onPress={() => nudge('above', -1)} style={s.stepBtn}><Text style={s.stepTxt}>−</Text></Pressable>
                  <TextInput
                    editable={enabled}
                    value={above}
                    onChangeText={setAbove}
                    keyboardType="decimal-pad"
                    placeholder={currentRate != null ? (currentRate + step).toFixed(decimals) : 'Value'}
                    placeholderTextColor={t.colors.subtext}
                    style={s.input}
                  />
                  <Pressable disabled={!enabled} onPress={() => nudge('above', +1)} style={s.stepBtn}><Text style={s.stepTxt}>+</Text></Pressable>
                </View>
              </View>

              {/* BELOW */}
              <View style={[s.fieldCard, !enabled && s.disabled]}>
                <View style={s.labelRow}><Text style={s.label}>When it drops below ({quote})</Text></View>
                <View style={s.controlsRow}>
                  <Pressable disabled={!enabled} onPress={() => nudge('below', -1)} style={s.stepBtn}><Text style={s.stepTxt}>−</Text></Pressable>
                  <TextInput
                    editable={enabled}
                    value={below}
                    onChangeText={setBelow}
                    keyboardType="decimal-pad"
                    placeholder={currentRate != null ? (currentRate - step).toFixed(decimals) : 'Value'}
                    placeholderTextColor={t.colors.subtext}
                    style={s.input}
                  />
                  <Pressable disabled={!enabled} onPress={() => nudge('below', +1)} style={s.stepBtn}><Text style={s.stepTxt}>+</Text></Pressable>
                </View>
              </View>

              {/* Optional % */}
              <Pressable onPress={() => setShowPct(v => !v)} style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}>
                <ChevronDown width={14} height={14} color={t.colors.subtext} style={{
                  transform: [{
                    rotate: showPct ? '180deg' : '0deg'
                  }]
                }} />
                <Text style={s.moreTxt}>{showPct ? 'Hide % move' : 'Add % move (optional)'}</Text>
              </Pressable>

              {showPct && (
                <View style={[s.fieldCard, !enabled && s.disabled]}>
                  <View style={s.labelRow}><Text style={s.label}>If it moves by (%)</Text></View>
                  <View style={s.controlsRow}>
                    <TextInput
                      editable={enabled}
                      value={pct}
                      onChangeText={setPct}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 1"
                      placeholderTextColor={t.colors.subtext}
                      style={[s.input, {
                        flex: 0,
                        width: 120
                      }]}
                    />
                  </View>
                </View>
              )}

              {/* Footer */}
              <View style={s.footer}>
                {enabled ? (
                  <Pressable onPress={() => setEnabled(false)}><Text style={s.link}>Disable</Text></Pressable>
                ) : <View />}
                <Pressable onPress={save} style={s.primary}>
                  <Text style={s.primaryTxt}>{enabled ? 'Done' : 'Close'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

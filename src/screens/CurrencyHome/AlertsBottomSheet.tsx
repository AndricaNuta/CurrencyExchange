import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { Bell } from 'react-native-feather';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { setAlerts, toggleFavorite } from '../../redux/slices/favoritesSlice';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  base: string;
  quote: string;
  currentRate?: number;
  pairId: string; // `${base}-${quote}`
};

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
    },
    bellBtn: (enabled: boolean) => ({
      height: 28,
      borderRadius: 999,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: enabled ? t.colors.tint : alpha(t.colors.border, 0.9),
      backgroundColor: enabled ? alpha(t.colors.tint, 0.12) : 'transparent',
    }),
    bellTxt: (enabled: boolean) => ({
      color: enabled ? t.colors.tint : t.colors.subtext,
      fontWeight: '700',
      fontSize: 12,
    }),
    edit: {
      color: t.colors.subtext,
      fontSize: 12,
      textDecorationLine: 'underline'
    },
    // expanded
    expanded: {
      marginTop: 8,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.03) : alpha('#111827', 0.02),
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    chip: (active: boolean) => ({
      height: 30,
      paddingHorizontal: 12,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: active ? t.colors.tint : alpha(t.colors.border, 0.9),
      backgroundColor: active ? alpha(t.colors.tint, 0.14) : 'transparent',
    }),
    chipTxt: (active: boolean) => ({
      color: active ? t.colors.tint : t.colors.text,
      fontWeight: '600',
      fontSize: 12
    }),
    input: {
      height: 36,
      minWidth: 90,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      color: t.colors.text,
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.04) : alpha('#111827', 0.03),
    },
    label: {
      color: t.colors.subtext,
      fontSize: 12
    },
  })
);

const parseNum = (s: string | number | null): number | null => {
  if (s == null) return null;
  const v = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};

export const SmartAlertInline: React.FC<Props> = ({
  base, quote, currentRate, pairId
}) => {
  const s = useStyles();
  const t = useTheme();
  const dispatch = useDispatch();

  const fav = useSelector((st: RootState) => st.favorites.items[pairId]);
  const alerts = fav?.alerts;

  // enabled if there's any rule set
  const enabled = !!alerts && (alerts.onChangePct != null || alerts.above != null || alerts.below != null);

  const [expanded, setExpanded] = useState(false);
  const [pct, setPct] = useState(alerts?.onChangePct != null ? String(alerts.onChangePct) : '1'); // default 1%
  const [above, setAbove] = useState(alerts?.above != null ? String(alerts.above) : '');
  const [below, setBelow] = useState(alerts?.below != null ? String(alerts.below) : '');
  const presetPercents = useMemo(() => ['0.5', '1', '2', '5'], []);

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const toggleMain = () => {
    animate();
    if (!enabled) {
      // ensure pair is favorited (optional)
      if (!fav) dispatch(toggleFavorite({
        base,
        quote
      }));
      // smart default → 1% move, notify once per crossing, min interval 60
      dispatch(setAlerts({
        base,
        quote,
        alerts: {
          onChangePct: parseNum(pct) ?? 1,
          above: null,
          below: null,
          notifyOncePerCross: true,
          minIntervalMinutes: 60
        }
      }));
    } else {
      // disable all rules
      dispatch(setAlerts({
        base,
        quote,
        alerts: {
          onChangePct: null,
          above: null,
          below: null
        }
      }));
      setExpanded(false);
    }
  };

  const saveEdits = () => {
    animate();
    dispatch(setAlerts({
      base,
      quote,
      alerts: {
        onChangePct: parseNum(pct),
        above: parseNum(above),
        below: parseNum(below),
      }
    }));
    setExpanded(false);
  };

  return (
    <View>
      <View style={s.wrap}>
        <Pressable
          onPress={toggleMain}
          style={s.bellBtn(enabled)}
          accessibilityLabel={enabled ? 'Disable alerts' : 'Enable smart alerts'}
        >
          <Bell width={16} height={16} color={enabled ? t.colors.primary : t.colors.subtext} />
          <Text style={s.bellTxt(enabled)}>
            {enabled ? 'Alerts ON' : 'Alerts'}
          </Text>
        </Pressable>

        <Pressable onPress={() => { animate(); setExpanded((v) => !v); }} accessibilityLabel="Edit alert rules">
          <Text style={s.edit}>{expanded ? 'Hide' : 'Edit'}</Text>
        </Pressable>
      </View>

      {expanded && (
        <View style={s.expanded}>
          <View style={s.row}>
            <Text style={s.label}>% change since baseline</Text>
          </View>
          <View style={s.chips}>
            {presetPercents.map((p) => {
              const active = pct === p;
              return (
                <Pressable key={p} onPress={() => setPct(p)} style={s.chip(active)} accessibilityLabel={`Set ${p}%`}>
                  <Text style={s.chipTxt(active)}>{p}%</Text>
                </Pressable>
              );
            })}
            <TextInput value={pct} onChangeText={setPct} keyboardType="decimal-pad" placeholder="custom %" style={s.input} placeholderTextColor={t.colors.subtext} />
          </View>

          <View style={[s.row, {
            marginTop: 6
          }]}>
            <Text style={s.label}>Absolute thresholds (optional)</Text>
          </View>
          <View style={{
            flexDirection: 'row',
            gap: 10
          }}>
            <TextInput value={above} onChangeText={setAbove} keyboardType="decimal-pad" placeholder="Above" style={s.input} placeholderTextColor={t.colors.subtext} />
            <TextInput value={below} onChangeText={setBelow} keyboardType="decimal-pad" placeholder="Below" style={s.input} placeholderTextColor={t.colors.subtext} />
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 10
          }}>
            <Pressable onPress={() => { animate(); setExpanded(false); }}>
              <Text style={s.edit}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdits}>
              <Text style={[s.edit, {
                color: t.colors.primary,
                textDecorationLine: 'none',
                fontWeight: '700'
              }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

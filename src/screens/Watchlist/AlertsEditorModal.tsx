import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useDispatch } from 'react-redux';
import { setAlerts, toggleFavorite } from '../../redux/slices/favoritesSlice';

type Props = {
  visible: boolean;
  onClose: () => void;
  base: string;
  quote: string;
  currentRate?: number;
  hasAlerts: boolean;
};

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: alpha('#000', 0.35),
      justifyContent: 'flex-end'
    },
    sheet: {
      backgroundColor: t.colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      borderTopWidth: 1,
      borderColor: t.colors.border,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: alpha(t.colors.subtext, 0.35),
      marginBottom: 10,
      marginTop: Platform.OS === 'ios' ? 6 : 2,
    },
    title: {
      fontWeight: '800',
      fontSize: 16,
      color: t.colors.text,
      marginBottom: 8
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap'
    },
    chip: {
      height: 32,
      paddingHorizontal: 14,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.colors.card,
    },
    chipTxt: {
      color: t.colors.text,
      fontWeight: '700',
      fontSize: 13
    },
    sub: {
      color: t.colors.subtext,
      fontSize: 12,
      marginTop: 10
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16
    },
    linkDanger: {
      color: t.colors.subtext,
      fontWeight: '700'
    },
    linkTint: {
      color: t.colors.tint,
      fontWeight: '800'
    },
  })
);

export default function AlertsEditorModal({
  visible, onClose, base, quote, currentRate, hasAlerts,
}: Props) {
  const s = useStyles();
  const dispatch = useDispatch();

  const enablePreset = (pct: number) => {
    dispatch(toggleFavorite({
      base,
      quote
    })); // ensures it’s saved
    dispatch(setAlerts({
      base,
      quote,
      alerts: {
        onChangePct: pct,
        above: null,
        below: null,
        notifyOncePerCross: true,
        minIntervalMinutes: 60
      },
    }));
    onClose();
  };

  const turnOff = () => {
    dispatch(setAlerts({
      base,
      quote,
      alerts: {
        onChangePct: null,
        above: null,
        below: null
      }
    }));
    onClose();
  };

  const presets = [0.5, 1, 2, 5];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Alerts • {base} → {quote}</Text>
          <View style={s.row}>
            {presets.map(p => (
              <Pressable key={p} onPress={() => enablePreset(p)} style={s.chip}>
                <Text style={s.chipTxt}>{p}%</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.sub}>Current: {currentRate ?? '—'}</Text>
          <View style={s.footer}>
            {hasAlerts ? (
              <Pressable onPress={turnOff}>
                <Text style={s.linkDanger}>Turn off</Text>
              </Pressable>
            ) : <View />}
            <Pressable onPress={onClose}>
              <Text style={s.linkTint}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

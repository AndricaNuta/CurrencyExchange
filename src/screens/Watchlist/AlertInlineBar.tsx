import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { makeStyles } from "../../theme/ThemeProvider";
import { alpha } from "../../theme/tokens";

type Props = {
  enabled: boolean;
  onPreset: (pct: number) => void;
  onEdit: () => void;
  onDisable: () => void;
};

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: {
      marginTop: 10,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: alpha(t.colors.border, 0.9),
      backgroundColor: t.scheme === 'dark' ? alpha('#fff', 0.03) : alpha('#111827', 0.02),
      gap: 10,
    },
    header: {
      color: t.colors.subtext,
      fontSize: 12,
      fontWeight: '700'
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    chip: {
      height: 28,
      paddingHorizontal: 12,
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
      fontSize: 12
    },
    link: {
      color: t.colors.tint,
      fontWeight: '800',
      fontSize: 12
    },
    subtle: {
      color: t.colors.subtext,
      fontWeight: '700',
      fontSize: 12
    },
  })
);

export default function AlertInlineBar({
  enabled, onPreset, onEdit, onDisable
}: Props) {
  const s = useStyles();
  const presets = [0.5, 1, 2, 5];

  return (
    <View style={s.wrap}>
      <Text style={s.header}>{enabled ? 'Alerts enabled' : 'Enable alerts'}</Text>
      <View style={s.row}>
        {presets.map((p) => (
          <Pressable key={p} onPress={() => onPreset(p)} style={s.chip} accessibilityLabel={`Enable ${p}% alert`}>
            <Text style={s.chipTxt}>{p}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onEdit}>
          <Text style={s.link}>Edit…</Text>
        </Pressable>
        {enabled && (
          <Pressable onPress={onDisable}>
            <Text style={s.subtle}>Turn off</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

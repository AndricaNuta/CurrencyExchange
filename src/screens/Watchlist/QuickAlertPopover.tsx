// components/QuickAlertPopover.tsx
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export type QuickAlertPopoverRef = { open: () => void; close: () => void; };

type Props = {
  onPreset: (pct: number) => void;       // enable alerts @ pct
  onDisable: () => void;                 // disable all alerts
  onManage: () => void;                  // open full editor
  enabled: boolean;
};

const useStyles = makeStyles((t)=>StyleSheet.create({
  wrap:{
    position:'absolute',
    top: 38,
    right: 12,
    zIndex: 30,
    borderRadius: 14,
    borderWidth:1,
    borderColor: alpha(t.colors.border,0.9),
    backgroundColor: t.colors.card,
    padding: 10,
    gap: 8,
    ...t.shadow.ios,
    ...t.shadow.android,
  },
  row:{
    flexDirection:'row',
    gap: 8,
    flexWrap:'wrap',
    maxWidth: 260
  },
  chip:(active:boolean)=>({
    height:28,
    paddingHorizontal:10,
    borderRadius:999,
    alignItems:'center',
    justifyContent:'center',
    borderWidth:1,
    borderColor: active? t.colors.tint : alpha(t.colors.border,0.9),
    backgroundColor: active? alpha(t.colors.tint,0.14) : t.colors.card,
  }),
  chipTxt:(active:boolean)=>({
    color: active? t.colors.tint : t.colors.text,
    fontWeight:'700',
    fontSize:12
  }),
  link:{
    color: t.colors.subtext,
    fontWeight:'700',
    fontSize:12,
    textDecorationLine:'underline'
  },
  divider:{
    height: StyleSheet.hairlineWidth,
    backgroundColor: alpha(t.colors.border,0.85),
    marginVertical: 4
  },
  header:{
    color:t.colors.subtext,
    fontSize:11,
    fontWeight:'700'
  },
}));

export const QuickAlertPopover = forwardRef<QuickAlertPopoverRef, Props>(({
  onPreset, onDisable, onManage, enabled
}, ref)=>{
  const s = useStyles();
  const t = useTheme();
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, ()=>({
    open: ()=> setOpen(true),
    close: ()=> setOpen(false),
  }),[]);

  if (!open) return null;

  const presets = [0.5, 1, 2, 5];

  return (
    <View style={s.wrap}>
      <Text style={s.header}>{enabled ? 'Alerts enabled' : 'Enable alerts'}</Text>
      <View style={s.row}>
        {presets.map(p => (
          <Pressable key={p} onPress={()=>{ onPreset(p); setOpen(false); }} style={s.chip(false)}>
            <Text style={s.chipTxt(false)}>{p}%</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.divider} />
      <View style={s.row}>
        <Pressable onPress={()=>{ onManage(); setOpen(false); }}>
          <Text style={s.link}>Manage…</Text>
        </Pressable>
        {enabled && (
          <Pressable onPress={()=>{ onDisable(); setOpen(false); }}>
            <Text style={[s.link,{
              color:t.colors.tint
            }]}>Turn off</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});
QuickAlertPopover.displayName = 'QuickAlertPopover';

// SmartAlertInline.tsx
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { setAlerts, toggleFavorite } from '../../redux/slices/favoritesSlice';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { Bell } from 'react-native-feather';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type SmartAlertInlineRef = { openEditor: () => void };

type Props = { base: string; quote: string; currentRate?: number; pairId: string };

const useStyles = makeStyles((t)=>StyleSheet.create({
  wrap:{ gap: 10 },

  // top controls row
  controls:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
  },
  leftControls:{ flexDirection:'row', alignItems:'center', gap:8 },
  bellPill:{
    flexDirection:'row', alignItems:'center', gap:8,
    height:32, paddingHorizontal:12, borderRadius:999,
    borderWidth:1, borderColor: alpha(t.colors.border,0.9),
    backgroundColor: t.scheme==='dark' ? alpha('#fff',0.03) : alpha('#111827',0.02),
  },
  bellOn:{ borderColor: t.colors.tint, backgroundColor: alpha(t.colors.tint,0.14) },
  bellTxt:(on:boolean)=>({ fontWeight:'800', fontSize:12, color: on? t.colors.tint : t.colors.text }),
  ghostBtn:{
    height:32, paddingHorizontal:12, borderRadius:999,
    borderWidth:1, borderColor: alpha(t.colors.border,0.9),
    backgroundColor:'transparent',
    alignItems:'center', justifyContent:'center'
  },
  ghostTxt:{ fontWeight:'700', fontSize:12, color:t.colors.text },

  // editor
  panel:{
    marginTop:6, padding:12, gap:10, borderRadius:12,
    borderWidth:1, borderColor:alpha(t.colors.border,0.9),
    backgroundColor: t.scheme==='dark' ? alpha('#fff',0.03) : alpha('#111827',0.02),
  },
  label:{ color:t.colors.subtext, fontSize:12 },
  input:{
    height:36, minWidth:90, borderRadius:10, paddingHorizontal:12,
    borderWidth:1, borderColor:alpha(t.colors.border,0.9),
    color:t.colors.text, backgroundColor: t.scheme==='dark' ? alpha('#fff',0.04) : alpha('#111827',0.03),
  },
  row:{ flexDirection:'row', gap:8, alignItems:'center', flexWrap:'wrap' },
  chip:(active:boolean)=>({
    height:28, paddingHorizontal:10, borderRadius:999, alignItems:'center', justifyContent:'center',
    borderWidth:1, borderColor: active? t.colors.tint : alpha(t.colors.border,0.9),
    backgroundColor: active? alpha(t.colors.tint,0.14) : 'transparent',
  }),
  chipTxt:(active:boolean)=>({ fontSize:12, fontWeight:'700', color: active? t.colors.tint : t.colors.text }),

  actions:{ flexDirection:'row', justifyContent:'flex-end', gap:12 },
  link:{ color:t.colors.subtext, fontWeight:'700' },
  save:{ color:t.colors.tint, fontWeight:'800' },
}));

const parseNum = (s: string | number | null): number | null => {
  if (s == null) return null;
  const v = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};

export const SmartAlertInline = forwardRef<SmartAlertInlineRef, Props>(({
  base, quote, currentRate, pairId
}, ref) => {
  const s = useStyles();
  const dispatch = useDispatch();

  const fav = useSelector((st: RootState) => st.favorites.items[pairId]);
  const saved = fav?.alerts;
  const enabled = !!saved && (saved.onChangePct != null || saved.above != null || saved.below != null);

  const [expanded, setExpanded] = useState(false);
  const [pct, setPct] = useState(saved?.onChangePct != null ? String(saved.onChangePct) : '1');
  const [above, setAbove] = useState(saved?.above != null ? String(saved.above) : '');
  const [below, setBelow] = useState(saved?.below != null ? String(saved.below) : '');
  const presets = useMemo(() => ['0.5','1','2','5'], []);

  useImperativeHandle(ref, ()=>({
    openEditor: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
    },
  }), []);

  const toggleMain = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!enabled) {
      if (!fav) dispatch(toggleFavorite({ base, quote }));
      dispatch(setAlerts({
        base, quote,
        alerts: { onChangePct: parseNum(pct) ?? 1, above: null, below: null, notifyOncePerCross: true, minIntervalMinutes: 60 },
      }));
      setExpanded(false);
    } else {
      dispatch(setAlerts({ base, quote, alerts: { onChangePct: null, above: null, below: null } }));
      setExpanded(false);
    }
  };

  const saveEdits = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dispatch(setAlerts({
      base, quote,
      alerts: { onChangePct: parseNum(pct), above: parseNum(above), below: parseNum(below) },
    }));
    setExpanded(false);
  };

  return (
    <View style={s.wrap}>
      {/* Controls bar */}
      <View style={s.controls}>
        <View style={s.leftControls}>
          <Pressable onPress={toggleMain} style={[s.bellPill, enabled && s.bellOn]} hitSlop={8}>
            <Bell width={16} height={16} color={enabled ? '#7c5cff' : undefined} />
            <Text style={s.bellTxt(enabled)}>{enabled ? 'Alerts On' : 'Alerts Off'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={()=>setExpanded(v=>!v)} style={s.ghostBtn} hitSlop={8}>
          <Text style={s.ghostTxt}>{expanded ? 'Close' : 'Manage rules'}</Text>
        </Pressable>
      </View>

      {/* Editor */}
      {expanded && (
        <View style={s.panel}>
          <Text style={s.label}>% change since baseline</Text>
          <View className="row" style={s.row}>
            {presets.map(p=>{
              const active = pct===p;
              return (
                <Pressable key={p} onPress={()=>setPct(p)} style={s.chip(active)}>
                  <Text style={s.chipTxt(active)}>{p}%</Text>
                </Pressable>
              );
            })}
            <TextInput value={pct} onChangeText={setPct} keyboardType="decimal-pad" placeholder="custom %" style={s.input}/>
          </View>

          <Text style={s.label}>Absolute thresholds (optional)</Text>
          <View style={s.row}>
            <TextInput value={above} onChangeText={setAbove} keyboardType="decimal-pad" placeholder="Above" style={s.input}/>
            <TextInput value={below} onChangeText={setBelow} keyboardType="decimal-pad" placeholder="Below" style={s.input}/>
          </View>

          <View style={s.actions}>
            <Pressable onPress={()=>setExpanded(false)}><Text style={s.link}>Cancel</Text></Pressable>
            <Pressable onPress={saveEdits}><Text style={s.save}>Save</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
});

SmartAlertInline.displayName = 'SmartAlertInline';

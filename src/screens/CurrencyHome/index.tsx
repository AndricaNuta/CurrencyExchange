import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, FlatList, Modal, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { setFromCurrency, setToCurrency, swapCurrencies } from '../../redux/slices/settingsSlice';
import { addHistory, HistoryItem } from '../../redux/slices/historySlice';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from 'react-native-text-recognition';
import { useGetCurrenciesQuery, useGetPairRateQuery } from '../../services/currencyApi';
import { pickerStyles, popoverStyles, styles, previewStyles } from './styles';

/* ---------- helpers ---------- */
function useSortedCurrencyList(map?: Record<string,string>) {
  return useMemo(
    () => map ? Object.entries(map).map(([code, name]) => ({ code, name }))
                    .sort((a,b) => a.code.localeCompare(b.code)) : [],
    [map]
  );
}
type Item = { code: string; name: string };
const currencyToFlag: Record<string,string> = { USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', RON:'🇷🇴', NOK:'🇳🇴', SEK:'🇸🇪', DKK:'🇩🇰', CHF:'🇨🇭', CAD:'🇨🇦', AUD:'🇦🇺', NZD:'🇳🇿', JPY:'🇯🇵', PLN:'🇵🇱', HUF:'🇭🇺', CZK:'🇨🇿', TRY:'🇹🇷', BGN:'🇧🇬', AED:'🇦🇪', SAR:'🇸🇦', INR:'🇮🇳', ILS:'🇮🇱' };
const flag = (code: string) => currencyToFlag[code] ?? '🌐';
const fmt = (n:number,c:string,max=2)=>{ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:c,maximumFractionDigits:max}).format(n);}catch{return `${n.toFixed(max)} ${c}`;}};
const nowDate = ()=>{ const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };

/* ---------- OCR helpers (your code) ---------- */
type Candidate = { raw:string; value:number; currency?:string; line?:string; score:number };
const SYMBOL_TO_CODE: Record<string, string> = { '€':'EUR', '$':'USD', '£':'GBP', '¥':'JPY', '₺':'TRY', '₩':'KRW', '₪':'ILS', '₹':'INR', 'lei':'RON', 'lei.':'RON' };
const CODE_SET = new Set(['EUR','USD','GBP','JPY','RON','CHF','CAD','AUD','NZD','PLN','HUF','SEK','NOK','DKK','CZK','TRY','BGN','RSD','UAH','ILS','AED','SAR','INR']);
function parseFlexibleAmount(raw: string): number | null {
  let s = raw.replace(/\s+/g,'').replace(/[^\d.,-]/g,''); if(!s) return null;
  const lc=s.lastIndexOf(','), ld=s.lastIndexOf('.'); let dec:','|'.'|null=null;
  if(lc!==-1&&ld!==-1) dec=lc>ld?',':'.'; else if(lc!==-1) dec=/,\d{2}$/.test(s)?',':null; else if(ld!==-1) dec=/\.\d{2}$/.test(s)?'.':null;
  if(dec===','){ s=s.replace(/\./g,'').replace(',','.'); } else if(dec==='.'){ s=s.replace(/,/g,''); } else { s=s.replace(/[.,](?=\d{3}(\D|$))/g,''); }
  const n=Number(s); return Number.isFinite(n)?n:null;
}
function detectPriceCandidates(lines: string[]): Candidate[] {
  const out: Candidate[] = [];
  for (const line of lines) {
    const matches = line.match(/([€$£¥₩₺₪₹]|lei\.?|[A-Z]{3})?\s*-?\s*\d[\d.,]*\s*([€$£¥₩₺₪₹]|lei\.?|[A-Z]{3})?/gi);
    if (!matches) continue;
    let base = 1;
    if (/\b(total|grand\s*total|amount due|totalul|suma|sumă)\b/i.test(line)) base += 5;
    else if (/\b(sub\s*total|subtotal)\b/i.test(line)) base += 2;
    else if (/\b(vat|tva|service|tip|tax)\b/i.test(line)) base += 1;
    for (const m of matches) {
      const raw = m.trim();
      let currency: string | undefined;
      const sym = raw.match(/[€$£¥₩₺₪₹]/)?.[0]; if (sym) currency = SYMBOL_TO_CODE[sym];
      if (!currency && /\blei\.?\b/i.test(raw)) currency = 'RON';
      const code = raw.match(/\b[A-Z]{3}\b/)?.[0]; if (!currency && code && CODE_SET.has(code)) currency = code;
      const value = parseFlexibleAmount(raw); if (value==null || value<=0 || value>1_000_000) continue;
      let score = base; const dec=(raw.match(/[.,](\d+)/)?.[1]?.length ?? 0);
      if (dec===2) score += 1; if (currency) score += 2;
      out.push({ raw, value, currency, line, score });
    }
  }
  const map = new Map<string, Candidate>();
  for (const c of out) { const k = `${c.currency ?? 'UNK'}|${c.value.toFixed(2)}`; const prev = map.get(k); if (!prev || c.score > prev.score) map.set(k, c); }
  return [...map.values()].sort((a,b)=>b.score-a.score);
}

/* ---------- Currency picker modal ---------- */
function CurrencyPicker({ visible, onClose, items, onSelect }:{
  visible:boolean; onClose:()=>void; items:Item[]; onSelect:(code:string)=>void;
}) {
  const [q,setQ] = useState('');
  const data = useMemo(() => !q?items:items.filter(i =>
    i.code.toLowerCase().includes(q.toLowerCase()) || i.name.toLowerCase().includes(q.toLowerCase())
  ), [q, items]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={pickerStyles.backdrop}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.grabber} />
          <Text style={pickerStyles.title}>Choose currency</Text>
          <TextInput placeholder="Search" value={q} onChangeText={setQ} style={pickerStyles.search} autoFocus/>
          <FlatList
            data={data}
            keyExtractor={(i)=>i.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item })=>(
              <Pressable onPress={()=>{ onSelect(item.code); onClose(); }} style={pickerStyles.row}>
                <Text style={pickerStyles.flag}>{flag(item.code)}</Text>
                <View style={{flex:1}}>
                  <Text style={pickerStyles.rowPrimary}>{item.code}</Text>
                  <Text style={pickerStyles.rowSecondary} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={pickerStyles.chev}>›</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={onClose} style={pickerStyles.close}><Text style={pickerStyles.closeTxt}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------- Main --------------------------- */

export default function CurrencyConverterScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  // Redux settings
  const from = useSelector((s:RootState)=>s.settings.fromCurrency);
  const to   = useSelector((s:RootState)=>s.settings.toCurrency);
  const decimals = useSelector((s:RootState)=>s.settings.decimals);
  const history = useSelector((s:RootState)=>s.history.items);
  const dispatch = useDispatch();

  // Data
  const { data: currencies, isLoading, error } = useGetCurrenciesQuery();
  const items = useSortedCurrencyList(currencies);
  const { data: pair, isFetching, error: rateError } = useGetPairRateQuery({ from, to }, { refetchOnFocus: true, refetchOnReconnect: true });

  // Local UI
  const [amount, setAmount] = useState('1000');
  const [pickFromOpen, setPickFromOpen] = useState(false);
  const [pickToOpen, setPickToOpen]     = useState(false);
  const [scanOpen, setScanOpen]         = useState(false);

  // Preset from History
  useEffect(() => {
    const p = route?.params?.preset as { from:string; to:string; amount:number } | undefined;
    if (p) {
      dispatch(setFromCurrency(p.from));
      dispatch(setToCurrency(p.to));
      setAmount(String(p.amount));
    }
  }, [route?.params?.preset, dispatch]);

  // Conversions
  const amtNum = Number(amount.replace(',','.')) || 0;
  const rate = pair?.rate ?? 0;
  const converted = amtNum * rate;

  // OCR state
  const [picking, setPicking] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pickErr, setPickErr] = useState<string|null>(null);

  const onPickImage = useCallback(async () => {
    try {
      setPickErr(null); setPicking(true);
      const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      const asset = res?.assets?.[0];
      if (!asset?.uri) { setPicking(false); return; }
      const lines = await TextRecognition.recognize(asset.uri);
      const cands = detectPriceCandidates((lines ?? []).map(l => l.replace(/\s+/g,' ').trim()).filter(Boolean));
      setCandidates(cands.slice(0, 8));
    } catch (e:any) {
      setPickErr(String(e?.message ?? e));
    } finally {
      setPicking(false);
    }
  }, []);

  const applyCandidate = useCallback((c: Candidate) => {
    setAmount(String(c.value));
    if (c.currency && c.currency !== from) dispatch(setFromCurrency(c.currency));
    // Save to history when we have a rate
    if (rate) {
      dispatch(addHistory({
        source: 'gallery',
        from: c.currency ?? from,
        to,
        amount: c.value,
        converted: c.value * rate,
        rate,
      }));
    }
  }, [dispatch, from, to, rate]);

  // Scan actions
  const handleScanLive  = () => {/* TODO: camera overlay */};
  const handleTakePhoto = () => {/* TODO: launch camera */};
  const handleAddImage  = async () => { await onPickImage(); };

  const swap = () => dispatch(swapCurrencies());

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator/><Text style={styles.dim}>Loading currencies…</Text></View>;
  }
  if (error || !items.length) {
    return <View style={styles.center}><Text>Couldn’t load currencies.</Text></View>;
  }

  return (
    <View style={styles.screen}>
      {/* Card */}
      <View style={styles.card}>
        {/* Top: Amount */}
        <View style={[styles.block, styles.blockTop]}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockLabel}>Amount</Text>
            <Pressable style={styles.pill} onPress={() => setPickFromOpen(true)}>
              <Text style={styles.pillFlag}>{flag(from)}</Text>
              <Text style={styles.pillCode}>{from}</Text>
              <Text style={styles.pillChevron}>▾</Text>
            </Pressable>
          </View>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType={Platform.select({ ios:'decimal-pad', android:'numeric' })}
            placeholder="0"
            style={styles.bigInput}
          />
          <Text style={styles.subAmount}>{fmt(amtNum, from, decimals)}</Text>
        </View>

        {/* Swap */}
        <Pressable onPress={swap} style={styles.swapCircle}><Text style={styles.swapArrow}>↕︎</Text></Pressable>

        {/* Bottom: Converted */}
        <View style={[styles.block, styles.blockBottom]}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockLabel}>Converted to</Text>
            <Pressable style={styles.pill} onPress={() => setPickToOpen(true)}>
              <Text style={styles.pillFlag}>{flag(to)}</Text>
              <Text style={styles.pillCode}>{to}</Text>
              <Text style={styles.pillChevron}>▾</Text>
            </Pressable>
          </View>

          {isFetching ? (
            <ActivityIndicator />
          ) : rateError ? (
            <Text style={styles.error}>Couldn’t fetch rate.</Text>
          ) : (
            <>
              <Text style={styles.bigConverted}>
                {new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(converted)}
              </Text>
              <Text style={styles.subAmount}>{fmt(converted, to, decimals)}</Text>
            </>
          )}
        </View>
      </View>

      {/* Mid-market row */}
      <View style={styles.rateRow}>
        <Text style={styles.rateText}>
          Mid-market rate <Text style={styles.rateStrong}>
            {rate ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(rate) : '—'}
          </Text> {to}
        </Text>
        <View style={styles.timePill}><Text style={styles.timeTxt}>{nowDate()}</Text></View>
      </View>

      {/* Recent preview (tap to reuse) */}
      {!!history.length && (
        <View style={previewStyles.wrap}>
          <View style={previewStyles.header}>
            <Text style={previewStyles.title}>Recent</Text>
            <Pressable onPress={() => nav.navigate('History')}>
              <Text style={previewStyles.link}>View all</Text>
            </Pressable>
          </View>
          {history.slice(0,5).map(h => (
            <Pressable key={h.id} style={previewStyles.row}
              onPress={()=>{
                dispatch(setFromCurrency(h.from));
                dispatch(setToCurrency(h.to));
                setAmount(String(h.amount));
              }}>
              <Text style={previewStyles.main}>
                {h.amount.toFixed(2)} {h.from} → {h.converted.toFixed(2)} {h.to}
              </Text>
              <Text style={previewStyles.meta}>
                {new Date(h.when).toLocaleString()} • {h.rate.toFixed(4)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Upload → OCR (kept) */}
      <Pressable onPress={onPickImage} style={styles.pickBtn} disabled={picking}>
        {picking ? <ActivityIndicator /> : <Text style={styles.pickTxt}>📷 Add image</Text>}
      </Pressable>
      {!!pickErr && <Text style={styles.err}>{pickErr}</Text>}
      {!!candidates.length && (
        <View style={styles.detectCard}>
          <Text style={styles.subTitle}>Detected prices</Text>
          {candidates.map((c, i) => (
            <Pressable key={`${c.value}-${c.currency ?? 'UNK'}-${i}`} onPress={() => applyCandidate(c)} style={styles.candRow}>
              <Text style={styles.candMain}>{c.currency ? `${c.currency} ` : ''}{c.value.toFixed(2)}</Text>
              {!!c.line && <Text style={styles.candLine} numberOfLines={1}>{c.line}</Text>}
            </Pressable>
          ))}
          <Text style={styles.hint}>Tap a value to fill the converter.</Text>
        </View>
      )}

      {/* FAB + scan popover (small)
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' }}>
        <Pressable onPress={() => setScanOpen(true)} style={({pressed})=>[fabStyles.fab, pressed && { transform:[{ scale:0.98 }] }]}>
          <Text style={fabStyles.plus}>＋</Text>
        </Pressable>
      </View>
      <ScanActionsPopover
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onLive={handleScanLive}
        onCamera={handleTakePhoto}
        onGallery={onPickImage} // ← opens library (your flow)
      />
 */}
      {/* Currency pickers */}
      <CurrencyPicker visible={pickFromOpen} onClose={()=>setPickFromOpen(false)} items={items} onSelect={(code)=>dispatch(setFromCurrency(code))} />
      <CurrencyPicker visible={pickToOpen}   onClose={()=>setPickToOpen(false)}   items={items} onSelect={(code)=>dispatch(setToCurrency(code))} />
    </View>
  );
}

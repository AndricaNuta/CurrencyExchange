import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CurvedBottomBar } from 'react-native-curved-bottom-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from './RootStackParamList';
import CurrencyConverterScreen from '../screens/CurrencyHome';
import FAB from '../components/FAB';
import { captureWithCamera, pickFromGallery } from '../ocr/ocrService';
import { TabBarItem } from '../components/TabBarItem';
import { makeStyles, useTheme as useAppTheme } from '../theme/ThemeProvider';
import { alpha } from '../theme/tokens';
import ScanActionsPopover from '../components/ScanActionsPopover';
import WatchlistScreen from '../screens/Watchlist';
import Tooltip from 'react-native-walkthrough-tooltip';
import { AppTipContent } from '../components/TipComponents/AppTipContent';
import { events } from '../screens/onboarding/events';
import { delKey, getBool, setBool } from '../services/mmkv';
import { OB_KEYS, triggerTipOnce } from '../screens/onboarding/onboardingKeys';
import { FirstTimeTipPressable, FirstTimeTipPressableHandle } from '../components/TipComponents/FirstTimeTipPressable';

const {
  width: SCREEN_W
} = Dimensions.get('window');
type StackNav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = keyof MainTabParamList;

export default function TabNavigation() {
  const insets = useSafeAreaInsets();
  const stackNav = useNavigation<StackNav>();
  const t = useAppTheme();
  const s = useStyles();
  const [scanOpen, setScanOpen] = useState(false);
  const fabTipRef = useRef<FirstTimeTipPressableHandle>(null);
  const seenRef = useRef(getBool(OB_KEYS.FAB_TIP));
  const [showFabCoach, setShowFabCoach] = useState(false);
  const handleFabPress = () => {
    const first = !seenRef.current;
    setScanOpen(v => !v);
    if (first) setShowFabCoach(true);
  };

  const markFabTipSeen = () => {
    if (!seenRef.current) {
      seenRef.current = true;
      setBool(OB_KEYS.FAB_TIP, true);
    }
    setShowFabCoach(false);
  };

  const onTakePhoto = useCallback(async () => {
    setScanOpen(false);
    await new Promise(r => setTimeout(r, 80));
    try {
      const res = await captureWithCamera(8);
      if (res?.asset?.uri && res.candidates?.length) {
        stackNav.navigate('ScanPreview', {
          uri: res.asset.uri!,
          candidates: res.candidates!
        });
      } else {
        Alert.alert(
          'Scan Failed',
          'We couldn’t detect a price in this photo. Try again with better lighting or focus.'
        );
      }
    } catch (e: any) {
      console.warn('[OCR] camera failed', e);
      Alert.alert(
        'Camera Error',
        'Something went wrong while capturing the image. Please try again.'
      );
    }
  }, [stackNav]);

  useEffect(() => {
    const handler = () => {
      triggerTipOnce(OB_KEYS.WATCHLIST_STEP2, () => setWatchlistTip(true));
    };
    events.on('tour.starToWatchlist.step2', handler);
    return () => events.off('tour.starToWatchlist.step2', handler);
  }, []);

  const onPickImage = useCallback(async () => {
    setScanOpen(false);
    await new Promise(r => setTimeout(r, 80));
    try {
      const res = await pickFromGallery(8);
      if (res?.asset?.uri && res.candidates?.length) {
        stackNav.navigate('ScanPreview', {
          uri: res.asset.uri!,
          candidates: res.candidates!
        });
      } else {
        Alert.alert(
          'No Price Found',
          'We couldn’t detect a price in this image. Please pick another photo.'
        );
      }
    } catch (e: any) {
      console.warn('[OCR] pick failed', e);
      Alert.alert(
        'Upload Error',
        'Something went wrong while uploading the image. Please try again.'
      );
    }
  }, [stackNav]);
  const [watchlistTip, setWatchlistTip] = useState(false);

  useEffect(() => {
    const sub = () => setWatchlistTip(true);
    events.on('tour.starToWatchlist.step2', sub);
    return () => events.off('tour.starToWatchlist.step2', sub);
  }, []);

  const renderTabItem = ({
    routeName, selectedTab, navigate,
  }: { routeName: TabKey; selectedTab: TabKey; navigate: (name: TabKey) => void; }) => {
    const open = () => navigate(routeName);

    if (routeName !== 'Watchlist') {
      return (
        <TabBarItem
          label={routeName}
          selected={selectedTab === routeName}
          onPress={open}
        />
      );
    }
    return (
      <TabBarItem
        label="Watchlist"
        selected={selectedTab === 'Watchlist'}
        onPress={open}
        coachmarkVisible={watchlistTip}
        coachmarkPlacement="top"
        coachmarkOnClose={() => setWatchlistTip(false)}
        coachmarkPrimaryPress={() => {
          setWatchlistTip(false);
          setBool(OB_KEYS.WATCHLIST_STEP3, true);
          setWatchlistTip(false);
          requestAnimationFrame(open);       // switch tab
        }}
      />
    );
  };

  return (
    <View style={[s.container, {
      paddingBottom: Math.max(insets.bottom, 8)
    }]}>
      {/* <SpotlightProvider>*/}
      <CurvedBottomBar.Navigator
        id="MainTabs"
        type="DOWN"
        circlePosition="CENTER"
        width={SCREEN_W}
        height={50}
        circleWidth={55}
        bgColor={t.colors.surface}
        borderTopLeftRight
        borderColor="transparent"
        borderWidth={0}
        backBehavior="initialRoute"
        style={s.bar}
        defaultScreenOptions
        shadowStyle={s.shadow}
        screenOptions={{
          headerShown: false
        }}
        renderCircle={() =>
          <FirstTimeTipPressable
            ref={fabTipRef}
            storageKey={OB_KEYS.FAB_TIP}
            placement="top"
            backdrop="rgba(0,0,0,0.12)"
            blockActionOnFirstPress={false}
            autoOpenOnFirstPress={false}
            onPress={handleFabPress}
            content={({
              close
            }) => (
              <AppTipContent
                title="Tip: Scan prices"
                text="Use Camera or Upload to convert prices from your own menu photos."
                primaryLabel="Continue"
                onPrimaryPress={() => { close(); handleFabPress(); }}
                arrowPosition="top"
              />
            )}
          >
            <FAB open={scanOpen} />
          </FirstTimeTipPressable>
        }
        tabBar={renderTabItem}
      >
        <CurvedBottomBar.Screen
          name="Converter"
          position="LEFT"
          component={CurrencyConverterScreen}
          options={{
            headerShown: false
          }}
        />
        <CurvedBottomBar.Screen
          name="Watchlist"
          position="RIGHT"
          component={WatchlistScreen}
          options={{
            headerShown: false
          }}
        />
      </CurvedBottomBar.Navigator>
      <ScanActionsPopover
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onLive={() => { setScanOpen(false); stackNav.navigate('LiveScan'); }}
        onCamera={onTakePhoto}
        onGallery={onPickImage}
        showCoachmark={showFabCoach}
        onCoachmarkSeen={markFabTipSeen}
      />
      {/*} <SpotlightOverlay accent="#E3D095" />

      </SpotlightProvider>*/}
    </View>
  );
}

const useStyles = makeStyles((t) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface,
  },
  bar: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  shadow: {
    shadowColor: t.scheme === 'dark' ? alpha('#000', 0.9) : '#000',
    shadowOpacity: t.scheme === 'dark' ? 0.18 : 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: -10
    },
    elevation: t.scheme === 'dark' ? 8 : 12,
  },
}));
function WatchlistTabIconWithTip({ children }: { children: React.ReactElement; }) {
  const [visible, setVisible] = useState(false);
  const nav = useNavigation<any>();

  useEffect(() => {
    const sub = () => setVisible(true);
    events.on('tour.starToWatchlist.step2', sub);
    return () => events.off('tour.starToWatchlist.step2', sub);
  }, []);

  return (
    <Tooltip
      isVisible={visible}
      placement="top"
      onClose={() => setVisible(false)}
      backgroundColor="rgba(0,0,0,0.20)"
      tooltipStyle={{ backgroundColor: 'transparent', padding: 0 }}
      content={
        <AppTipContent
          title="Your saved pairs"
          text="Open Watchlist to see them with live updates."
          primaryLabel="Open Watchlist"
          onPrimaryPress={() => {
            setVisible(false);
            setBool(OB_KEYS.WATCHLIST_STEP3, true); // signal Step 3
            requestAnimationFrame(() => nav.navigate('Watchlist', { fromTour: true }));
          }}
          arrowPosition="top"
        />
      }
    >
      {children}
    </Tooltip>
  );
}
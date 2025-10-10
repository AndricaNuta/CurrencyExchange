import React, { useState, useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CurvedBottomBar } from 'react-native-curved-bottom-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from './RootStackParamList';
import CurrencyConverterScreen from '../screens/CurrencyHome';
import SettingsScreen from '../screens/Settings';
import FAB from '../components/FAB/FAB';
import { captureWithCamera, pickFromGallery } from '../ocr/ocrService';
import { TabBarItem } from '../components/TabBarItem';
import { makeStyles, useTheme as useAppTheme } from '../theme/ThemeProvider';
import { alpha } from '../theme/tokens';
import ScanRadialMenu from '../components/ScanRadialMenu';
import ScanActionsPopover from '../components/ScanActionsPopover/ScanActionsPopover';
import WatchlistScreen from '../screens/Watchlist';

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
  const anchorBottom = Math.max(insets.bottom, 8) + 60 /* bar height */ + 30; // place the arc above the bar+fab

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
      }
    } catch (e) { console.warn('[OCR] camera failed', e); }
  }, [stackNav]);

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
      }
    } catch (e) { console.warn('[OCR] pick failed', e); }
  }, [stackNav]);

  const renderTabItem = ({
    routeName, selectedTab, navigate,
  }: { routeName: TabKey; selectedTab: TabKey; navigate: (name: TabKey) => void; }) => (
    <TabBarItem
      label={routeName}
      selected={selectedTab === routeName}
      onPress={() => navigate(routeName)}
    />
  );

  return (
    <View style={[s.container, {
      paddingBottom: Math.max(insets.bottom, 8)
    }]}>
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
          <FAB open={scanOpen} onToggle={() => setScanOpen(v => !v)} />
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
      />

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

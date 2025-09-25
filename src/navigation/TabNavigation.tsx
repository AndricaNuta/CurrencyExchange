import React, { useState } from 'react';
import {Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CurvedBottomBar } from 'react-native-curved-bottom-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CurrencyConverterScreen from '../screens/CurrencyHome';
import HistoryScreen from '../screens/History/HistoryScreen';
import SettingsScreen from '../screens/Settings';
import FAB from '../components/FAB/FAB';
import ScanActionsPopover from '../components/ScanActionsPopover/ScanActionsPopover';
import { pickImageAndDetectPrices } from '../ocr/pickImageAndDetectPrices';
import type {RootStackParamList,
  MainTabParamList,} from './RootStackParamList';
  import { takePhotoAndDetectPrices } from '../ocr/takePhotoAndDetectPrices';

const {
  width: SCREEN_W
} = Dimensions.get('window');

type StackNav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = keyof MainTabParamList;

export default function TabNavigation() {
  const insets = useSafeAreaInsets();
  const stackNav = useNavigation<StackNav>();
  const [scanOpen, setScanOpen] = useState(false);
  const onTakePhoto = React.useCallback(async () => {
    setScanOpen(false);
    await new Promise(r => setTimeout(r, 80));
    try {
      const res = await takePhotoAndDetectPrices(8);
      if (res?.asset?.uri && res.candidates?.length) {
        stackNav.navigate('ScanPreview', {
          uri: res.asset.uri!,
          candidates: res.candidates!,
        });
      }
    } catch (e) {
      console.warn('[OCR] camera failed', e);
    }
  }, [stackNav]);

  const onPickImage = React.useCallback(async () => {
    setScanOpen(false);
    await new Promise(r => setTimeout(r, 80));
    try {
      const res = await pickImageAndDetectPrices(8);
      if (res?.asset?.uri && res.candidates?.length) {
        stackNav.navigate('ScanPreview', {
          uri: res.asset.uri,
          candidates: res.candidates,
        });
      }
    } catch (e) {
      console.warn('[OCR] pick failed', e);
    }
  }, [stackNav]);

  const renderTabItem = ({
    routeName,
    selectedTab,
    navigate,
  }: {
    routeName: TabKey;
    selectedTab: TabKey;
    navigate: (name: TabKey) => void;
  }) => (
    <TouchableOpacity
      onPress={() => navigate(routeName)}
      style={S.tabItem}
      activeOpacity={0.8}
    >
      <Text style={{
        fontSize: 18
      }}>
        {routeName === 'History'
          ? '🕘'
          : routeName === 'Settings'
            ? '⚙️'
            : '💱'}
      </Text>
      <Text style={[S.tabLabel, selectedTab === routeName && S.tabLabelActive]}>
        {routeName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[S.container, {
      paddingBottom: Math.max(insets.bottom, 8)
    }]}>
      <CurvedBottomBar.Navigator
        screenOptions={{
          headerShown: false
        }}
        screenListeners
        id="MainTabs"
        type="DOWN"
        circlePosition="CENTER"
        width={SCREEN_W}
        height={60}
        circleWidth={55}
        bgColor="#FFFFFF"
        borderTopLeftRight
        borderColor="transparent"
        borderWidth={0}
        backBehavior="initialRoute"
        style={S.bar}
        defaultScreenOptions
        shadowStyle={S.shadow}
        initialRouteName="Converter"
        renderCircle={() => <FAB onPress={() => setScanOpen(true)} />}
        tabBar={renderTabItem}
      >
        <CurvedBottomBar.Screen
          name="History"
          position="LEFT"
          component={HistoryScreen}
        />
        <CurvedBottomBar.Screen
          name="Converter"
          position="CIRCLE"
          component={CurrencyConverterScreen}
        />
        <CurvedBottomBar.Screen
          name="Settings"
          position="RIGHT"
          component={SettingsScreen}
        />
      </CurvedBottomBar.Navigator>

      <ScanActionsPopover
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onLive={() => {
          setScanOpen(false); /* TODO */
        }}
        onCamera={onTakePhoto}
        onGallery={onPickImage}
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  bar: {
    alignSelf: 'center'
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: -10
    },
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabLabel: {
    fontSize: 12,
    color: '#7d7b7d',
    marginTop: 4
  },
  tabLabelActive: {
    color: '#6F5AE6',
    fontWeight: '600'
  },
});

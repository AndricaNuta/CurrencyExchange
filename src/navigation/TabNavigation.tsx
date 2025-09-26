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
import ScanActionsPopover from '../components/ScanActionsPopover/ScanActionsPopover';
import { captureWithCamera, pickFromGallery } from '../ocr/ocrService';
import { TabBarItem } from '../components/TabBarItem';

const {
  width: SCREEN_W
} = Dimensions.get('window');
type StackNav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = keyof MainTabParamList;

export default function TabNavigation() {
  const insets = useSafeAreaInsets();
  const stackNav = useNavigation<StackNav>();
  const [scanOpen, setScanOpen] = useState(false);

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
    routeName, selectedTab, navigate
  }: {
    routeName: TabKey; selectedTab: TabKey; navigate: (name: TabKey) => void;
  }) => (
    <TabBarItem
      label={routeName}
      selected={selectedTab === routeName}
      onPress={() => navigate(routeName)} />
  );

  return (
    <View style={[S.container, {
      paddingBottom: Math.max(insets.bottom, 8)
    }]}>
      <CurvedBottomBar.Navigator
        screenOptions={{
          headerShown: false,

        }}
        screenListeners
        id="MainTabs" type="DOWN" circlePosition="CENTER"
        width={SCREEN_W} height={60} circleWidth={55}
        bgColor="#FFFFFF" borderTopLeftRight borderColor="transparent"
        borderWidth={0} backBehavior="initialRoute" style={S.bar}
        defaultScreenOptions shadowStyle={S.shadow}
        initialRouteName="Converter"
        renderCircle={() => <FAB onPress={() => setScanOpen(true)} />}
        tabBar={renderTabItem}
      >
        <CurvedBottomBar.Screen name="Converter" position="LEFT" component={CurrencyConverterScreen} />
        <CurvedBottomBar.Screen name="Settings"  position="RIGHT" component={SettingsScreen} />
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
});

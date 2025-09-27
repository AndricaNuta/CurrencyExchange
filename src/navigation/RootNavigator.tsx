import React from 'react';
import { StatusBar } from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigation from './TabNavigation';
import ScanPreviewScreen from '../screens/ScanResult/ScanPreviewScreen';
import LiveScanScreen from '../screens/LiveScanScreen';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { toNavTheme } from '../theme/navTheme';
import { useTheme as useAppTheme } from '../theme/ThemeProvider';
import { RootStackParamList } from './RootStackParamList';

export const navRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const pref = useSelector((s: RootState) => s.settings.themePreference);
  const isDark = pref === 'dark';

  const t = useAppTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={t.colors.navBg}
      />
      <NavigationContainer ref={navRef} theme={toNavTheme(t)}>
        <BottomSheetModalProvider>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.colors.bg },
            }}
          >
            <Stack.Screen name="TabNavigation" component={TabNavigation} />
            <Stack.Screen
              name="ScanPreview"
              component={ScanPreviewScreen}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                headerStyle: { backgroundColor: t.colors.card },
                headerTintColor: t.colors.text,
                contentStyle: { backgroundColor: t.colors.bg },
              }}
            />
            <Stack.Screen
              name="LiveScan"
              component={LiveScanScreen}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                headerStyle: { backgroundColor: t.colors.card },
                headerTintColor: t.colors.text,
                contentStyle: { backgroundColor: t.colors.bg },
              }}
            />
          </Stack.Navigator>
        </BottomSheetModalProvider>
      </NavigationContainer>
    </>
  );
}

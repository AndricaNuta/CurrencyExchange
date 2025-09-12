// navigation/RootNavigator.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
  Theme as NavTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigation from './TabNavigation';
import ScanPreviewScreen from '../screens/ScanResult/ScanPreviewScreen';
import type { RootStackParamList } from './RootStackParamList';

export const navRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // read the preference directly from Redux
  const pref = useSelector((s: RootState) => s.settings.themePreference); // 'light' | 'dark'
  const isDark = pref === 'dark';

  // (optional) your own tokens for nicer colors
  const tokens = isDark
    ? { bg:'#0B0F14', card:'#111827', text:'#F3F4F6', border:'#1F2937', primary:'#8AB4F8' }
    : { bg:'#FFFFFF', card:'#FFFFFF', text:'#111827', border:'#E5E7EB', primary:'#2563EB' };

  // map to React Navigation theme object
  const navTheme: NavTheme = isDark
    ? {
        ...NavDark,
        colors: {
          ...NavDark.colors,
          background: tokens.bg,
          card: tokens.card,
          text: tokens.text,
          border: tokens.border,
          primary: tokens.primary,
        },
      }
    : {
        ...NavLight,
        colors: {
          ...NavLight.colors,
          background: tokens.bg,
          card: tokens.card,
          text: tokens.text,
          border: tokens.border,
          primary: tokens.primary,
        },
      };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navRef} theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            // background for all screens
            contentStyle: { backgroundColor: tokens.bg },
          }}
        >
          <Stack.Screen name="TabNavigation" component={TabNavigation} />
          <Stack.Screen
            name="ScanPreview"
            component={ScanPreviewScreen}
            options={{
              headerShown: true,
              title: 'Preview',
              presentation: 'fullScreenModal',
              headerStyle: { backgroundColor: tokens.card },
              headerTintColor: tokens.text,
              contentStyle: { backgroundColor: tokens.bg },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

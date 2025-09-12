import React from 'react';
import {NavigationContainer,
  createNavigationContainerRef,} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanPreviewScreen from '../screens/ScanResult/ScanPreviewScreen';
import TabNavigation from './TabNavigation';
import { RootStackParamList } from './RootStackParamList';

export const navRef = createNavigationContainerRef<RootStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navRef}>
      <RootStack.Navigator screenOptions={{
        headerShown: false
      }}>
        <RootStack.Screen name="TabNavigation" component={TabNavigation} />
        <RootStack.Screen
          name="ScanPreview"
          component={ScanPreviewScreen}
          options={{
            presentation: 'fullScreenModal'
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

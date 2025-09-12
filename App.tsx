import React from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from './src/redux/store';
import RootNavigator from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import './src/localization';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{
      flex: 1
    }}>
      <BottomSheetModalProvider>
        <Provider store={store}>
          <SafeAreaProvider>
            <PersistGate loading={null} persistor={persistor}>
              <ThemeProvider>
                <RootNavigator />
              </ThemeProvider>
            </PersistGate>
          </SafeAreaProvider>
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

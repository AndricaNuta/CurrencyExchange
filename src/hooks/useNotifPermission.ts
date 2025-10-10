import messaging from '@react-native-firebase/messaging';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export type NotifState = 'authorized' | 'provisional' | 'denied' | 'blocked' | 'unknown';

export function useNotifPermission() {
  const [state, setState] = useState<NotifState>('unknown');
  const [checking, setChecking] = useState(false);

  const decode = (val: number | undefined): NotifState => {
    const A = messaging.AuthorizationStatus;
    switch (val) {
      case A.AUTHORIZED:   return 'authorized';
      case A.PROVISIONAL:  return 'provisional';
      case A.DENIED:       return 'denied';
      default:             return 'unknown';
    }
  };

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      // RNFirebase: hasPermission() returns iOS-style AuthorizationStatus on both platforms.
      // On Android pre-13 it usually returns AUTHORIZED by default.
      const current = await messaging().hasPermission();
      setState(decode(current));
    } catch {
      setState('unknown');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestEnable = useCallback(async () => {
    // Ask OS (iOS + Android 13+) for permission
    const status = await messaging().requestPermission();
    const next = decode(status);
    setState(next);
    if (next === 'denied' || next === 'unknown') {
      Alert.alert(
        'Turn on notifications',
        'Please enable notifications in your device settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings()
          },
        ]
      );
    }
  }, []);

  const openSettingsToDisable = useCallback(() => {
    // Apps can’t programmatically “turn off” notifications;
    // we deep-link to the OS settings instead.
    Alert.alert(
      'Turn off notifications',
      'To disable alerts, use your device notification settings for this app.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings()
        },
      ]
    );
  }, []);

  const enabled = state === 'authorized' || state === 'provisional';

  return {
    enabled,
    state,            // for UI text if you want
    checking,         // show spinner if needed
    refresh,
    requestEnable,    // call when user toggles ON
    openSettingsToDisable, // call when user toggles OFF
  };
}

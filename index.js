/**
 * @format
 */
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

(async () => {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const apns = await messaging().getAPNSToken();
    const registered = await messaging().isDeviceRegisteredForRemoteMessages;
    console.log('📡 APNs token:', apns, '| registered:', registered);
  } catch (e) {
    console.log('⚠️ APNs check error:', e);
  }
})();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 BG message:', remoteMessage);
});
AppRegistry.registerComponent(appName, () => App);

import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

export default function LiveScanScreen() {
  const device = useCameraDevice('back');
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable camera access');
      }
    })();
  }, []);

  if (!device) return <View style={{
    flex: 1,
    backgroundColor: 'black'
  }} />;

  return (
    <View style={{
      flex: 1
    }}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
    </View>
  );
}

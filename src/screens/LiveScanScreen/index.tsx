import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import ScanSheet from './ScanSheet';
import type { OCRResult } from '../../types/PriceOCR';

export default function LiveScanScreen() {
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const from = useSelector((s: RootState) => s.exchange.from);
  const to = useSelector((s: RootState) => s.exchange.to);
  const decimals = useSelector((s: RootState) => s.settings.decimals);

  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [ocr, setOcr] = useState<OCRResult | null>(null);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      if (status !== 'granted') Alert.alert('Please enable camera access');
    })();
  }, []);

  
  if (!device) return <View style={{ flex: 1, backgroundColor: 'black' }} />;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={StyleSheet.absoluteFill}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          setImgW(width); setImgH(height);
        }}
      >
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo
          // IMPORTANT: speed profile goes here (prop), not in takePhoto options
          photoQualityPrioritization="speed"
          // Optional quick wins:
          // zoom={0.15}
          // torch="off"
        />
      </View>

      <ScanSheet
        ocr={ocr}
        onPickCandidate={() => {}}
      />
    </View>
  );
}

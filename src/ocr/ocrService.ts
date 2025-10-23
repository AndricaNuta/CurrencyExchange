import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';
import { recognize } from '@react-native-ml-kit/text-recognition';
import { detectPriceCandidatesWithLabels, normalizeForOCR, type Candidate } from './ocrShared';
import { Platform } from 'react-native';

export type OCRPickResult = {
    candidates: Candidate[];
    asset?: Asset | { uri: string; width: number; height: number } };

export async function pickFromGallery(limit = 8): Promise<OCRPickResult | null>{
  const res = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeExtra: true
  });
  const asset = res?.assets?.[0];
  if (!asset?.uri) return null;

  const norm = await normalizeForOCR({
    uri: asset.uri,
    width: asset.width,
    height: asset.height
  });
  // ML Kit expects a file path on Android (no "file://")
  const imagePath = Platform.OS === 'android'
    ? norm.uri.replace('file://', '')
    : norm.uri;

  const {
    blocks = []
  } = await recognize(imagePath);
  const lines = blocks
    .flatMap(b => b.lines ?? [])
    .map(l => (l.text ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const candidates = detectPriceCandidatesWithLabels(lines).slice(0, limit);
  return {
    candidates,
    asset: {
      ...asset,
      uri: norm.uri,
      width: norm.width,
      height: norm.height
    }
  };
}

export async function captureWithCamera(
  limit = 8): Promise<OCRPickResult | null> {
  const res = await launchCamera({
    mediaType: 'photo',
    quality: 1,
    includeExtra: true,
    saveToPhotos: false,
    cameraType: 'back',
    presentationStyle: 'fullScreen',
    ...Platform.select({
      ios: {
        skipProcessing: true
      }
    })
  });
  const asset = res?.assets?.[0];
  if (!asset?.uri) return null;

  const norm = await normalizeForOCR({
    uri: asset.uri,
    width: asset.width,
    height: asset.height
  });
  const rawLines = await TextRecognition.recognize(norm.uri);
  const lines = (rawLines ?? []).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const candidates = detectPriceCandidatesWithLabels(lines).slice(0, limit);
  return {
    candidates,
    asset: {
      ...asset,
      uri: norm.uri,
      width: norm.width,
      height: norm.height
    } as Asset
  };
}

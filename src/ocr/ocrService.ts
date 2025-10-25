import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';
import { detectPriceCandidatesWithLabels, normalizeForOCR, type Candidate } from './ocrShared';
import { detectTextInImage } from '../native/PriceOCR'; // <-- your native module
import { Platform } from 'react-native';

export type OCRPickResult = {
  candidates: Candidate[];
  asset?: Asset | { uri: string; width: number; height: number };
};

export async function pickFromGallery(limit = 8): Promise<OCRPickResult | null> {
  const res = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeExtra: true,
  });
  const asset = res?.assets?.[0];
  if (!asset?.uri) return null;

  const norm = await normalizeForOCR({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  });

  // ✅ our native module accepts both "file://..." and plain paths
  const ocr = await detectTextInImage(norm.uri);

  // Reuse your existing JS candidate builder from line texts
  const lines =
    (ocr?.lines ?? [])
      .map((l: any) => (l.text ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

  const candidates = detectPriceCandidatesWithLabels(lines).slice(0, limit);

  return {
    candidates,
    asset: {
      ...asset,
      uri: norm.uri,
      width: norm.width,
      height: norm.height
    },
  };
}

export async function captureWithCamera(limit = 8): Promise<OCRPickResult | null> {
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
    }),
  });
  const asset = res?.assets?.[0];
  if (!asset?.uri) return null;

  const norm = await normalizeForOCR({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  });

  const ocr = await detectTextInImage(norm.uri);

  const lines =
    (ocr?.lines ?? [])
      .map((l: any) => (l.text ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

  const candidates = detectPriceCandidatesWithLabels(lines).slice(0, limit);

  return {
    candidates,
    asset: {
      ...asset,
      uri: norm.uri,
      width: norm.width,
      height: norm.height
    } as Asset,
  };
}

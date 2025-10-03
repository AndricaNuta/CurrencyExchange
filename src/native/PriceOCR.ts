import { NativeModules } from 'react-native';
import type { OCRResult } from '../types/PriceOCR';

const {
  RNPriceOCR
} = NativeModules;

export const detectTextInImage = async (uri: string): Promise<OCRResult> => {
  return RNPriceOCR.detectTextInImage(uri);
};

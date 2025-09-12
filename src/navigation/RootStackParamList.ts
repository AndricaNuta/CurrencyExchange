import { Candidate } from '../ocr/pickImageAndDetectPrices';

export type MainTabParamList = {
  History: undefined;
  Converter: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  TabNavigation: undefined;
  ScanPreview: { uri: string; candidates: Candidate[] };
};

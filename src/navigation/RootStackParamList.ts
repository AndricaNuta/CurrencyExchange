import { Candidate } from "../ocr/ocrShared";

export type MainTabParamList = {
  History: undefined;
  Converter: undefined;
  Settings: undefined;
  Watchlist: undefined;
};

export type RootStackParamList = {
  TabNavigation: undefined;
  ScanPreview: { uri: string; candidates: Candidate[] };
  LiveScan: undefined;
  Watchlist: undefined;
  Settings: undefined;
};

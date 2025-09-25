export type Quad = {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
export type Box = { x: number; y: number; width: number; height: number };

export type OCRLine = {
  text: string;
  box: Box;
  quad: any;
  lineIndex: number;
  blockIndex: number;
};

export type OCRPrice = {
  text: string;
  confidence?: number;
  box: Box;
  quad: any;
  lineIndex: number;
  lineText: string;
  lineBox: Box;
};
export type OCRWord = {
  text: string;
  confidence?: number;
  box: Box;
  lineIndex: number;
  blockIndex: number; };

export type OCRResult = {
  width: number;
  height: number;
  rotation?: number;
  words: any[];
  lines: OCRLine[];
  prices: OCRPrice[];
};


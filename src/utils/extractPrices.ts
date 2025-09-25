import type { OCRResult, OCRWord } from '../types/PriceOCR';

const PRICE_RE = /(?:(?:€|\$|£|RON|Ron|ron|LEI|Lei|lei)\s*)?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|\$|£|RON|Ron|ron|LEI|Lei|lei)?/;

export type PriceHit = {
  priceText: string;
  currency?: string;
  amountRaw: string;
  wordIndices: number[];
  lineIndex: number;
  priceBox: {
     x: number;
     y: number;
     width: number;
     height: number
    };
  lineBox: {
    x: number;
    y: number;
    width: number;
    height: number };
  lineText: string;
};

export function extractPrices(ocr: OCRResult): PriceHit[] {
  const hits: PriceHit[] = [];
  const wordsByLine = new Map<number, OCRWord[]>();
  ocr.words.forEach(w => {
    const arr = wordsByLine.get(w.lineIndex) ?? [];
    arr.push(w);
    wordsByLine.set(w.lineIndex, arr);
  });

  ocr.lines.forEach(line => {
    const tokens = wordsByLine.get(line.lineIndex) ?? [];
    const joined = tokens.map(t => t.text).join(' ');
    const match = joined.match(PRICE_RE);
    if (!match) return;

    const priceText = match[0].trim();
    let spanStart = 0;
    const bounds: number[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i].text;
      const idx = joined.indexOf(t, spanStart);
      const nextStart = idx + t.length;
      if (idx >= 0) {
        const before = joined.substring(0, idx + t.length);
        if (before.endsWith(priceText)) {
          bounds.push(i);
          break;
        }
        if (before.length >= match.index!
            &&
            before.length <= match.index! + priceText.length) {
          bounds.push(i);
        }
        spanStart = nextStart;
      }
    }

    if (bounds.length) {
      const sel = bounds.map(i => tokens[i]);
      const x1 = Math.min(...sel.map(w => w.box.x));
      const y1 = Math.min(...sel.map(w => w.box.y));
      const x2 = Math.max(...sel.map(w => w.box.x + w.box.width));
      const y2 = Math.max(...sel.map(w => w.box.y + w.box.height));

      hits.push({
        priceText,
        currency: priceText.match(/[€$£]|RON|LEI|lei|ron|lei/i)?.[0],
        amountRaw: priceText.replace(/[^\d.,]/g, ''),
        wordIndices: bounds.map(i => ocr.words.indexOf(tokens[i])),
        lineIndex: line.lineIndex,
        priceBox: {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1
        },
        lineBox: line.box,
        lineText: line.text,
      });
    }
  });

  return hits;
}


export function mapBoxToView(
  box: { x: number; y: number; width: number; height: number },
  imgW: number,
  imgH: number,
  viewW: number,
  viewH: number,
) {
  const scale = Math.min(viewW / imgW, viewH / imgH);
  const drawnW = imgW * scale;
  const drawnH = imgH * scale;
  const offsetX = (viewW - drawnW) / 2;
  const offsetY = (viewH - drawnH) / 2;

  return {
    left: offsetX + box.x * drawnW,
    top: offsetY + box.y * drawnH,
    width: box.width  * drawnW,
    height: box.height * drawnH,
  };
}


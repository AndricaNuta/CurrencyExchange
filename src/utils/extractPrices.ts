import { Candidate } from '../ocr/pickImageAndDetectPrices';
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


export function mapQuadToView(
  quad: { topLeft:{x:number,y:number}; topRight:{x:number,y:number}; bottomRight:{x:number,y:number}; bottomLeft:{x:number,y:number} },
  imgW: number, imgH: number,
  viewW: number, viewH: number
) {
  const scale = Math.min(viewW / imgW, viewH / imgH);
  const drawnW = imgW * scale;
  const drawnH = imgH * scale;
  const offsetX = (viewW - drawnW) / 2;
  const offsetY = (viewH - drawnH) / 2;

  const mapPoint = (p:{x:number,y:number}) => ({
    x: offsetX + p.x * drawnW,
    y: offsetY + p.y * drawnH,
  });

  return {
    topLeft: mapPoint(quad.topLeft),
    topRight: mapPoint(quad.topRight),
    bottomRight: mapPoint(quad.bottomRight),
    bottomLeft: mapPoint(quad.bottomLeft),
  };
}

// Convenience: from a mapped quad, get center/size/angle
export function quadMetrics(quad: {
  topLeft:{x:number,y:number}; topRight:{x:number,y:number};
  bottomRight:{x:number,y:number}; bottomLeft:{x:number,y:number};
}) {
  const cx = (quad.topLeft.x + quad.topRight.x + quad.bottomRight.x + quad.bottomLeft.x) / 4;
  const cy = (quad.topLeft.y + quad.topRight.y + quad.bottomRight.y + quad.bottomLeft.y) / 4;

  const w = Math.hypot(quad.topRight.x - quad.topLeft.x, quad.topRight.y - quad.topLeft.y);
  const h = Math.hypot(quad.bottomLeft.x - quad.topLeft.x, quad.bottomLeft.y - quad.topLeft.y);

  // Angle of the top edge, in radians
  const angle = Math.atan2(quad.topRight.y - quad.topLeft.y, quad.topRight.x - quad.topLeft.x);

  return {
    cx,
    cy,
    w,
    h,
    angle
  };
}



export function priceHitToCandidate
(h: PriceHit, fallbackCurrency: string): Candidate {
  const amount = Number(h.amountRaw.replace(',', '.')) || 0;

  return {
    raw: h.priceText,
    value: amount,
    currency: (h.currency ?? fallbackCurrency).toUpperCase(),
    line: h.lineText,
    label: h.lineText,
    lineIndex: h.lineIndex,
    score: 1,
  };
}

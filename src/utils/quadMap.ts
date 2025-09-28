// Types kept lightweight—match what you return from native
type Pt = { x: number; y: number };
type Quad = { topLeft: Pt; topRight: Pt; bottomRight: Pt; bottomLeft: Pt };

// Contain (your existing mapBoxToView math)
export function mapQuadToViewContain(
  quad: Quad,
  imgW: number, imgH: number,
  viewW: number, viewH: number
) {
  const scale = Math.min(viewW / imgW, viewH / imgH);
  const drawnW = imgW * scale;
  const drawnH = imgH * scale;
  const offsetX = (viewW - drawnW) / 2;
  const offsetY = (viewH - drawnH) / 2;

  const map = (p: Pt): Pt => ({
    x: offsetX + p.x * drawnW,
    y: offsetY + p.y * drawnH
  });

  return {
    topLeft: map(quad.topLeft),
    topRight: map(quad.topRight),
    bottomRight: map(quad.bottomRight),
    bottomLeft: map(quad.bottomLeft),
  };
}

// Cover (mirror mapBoxToCoverView)
export function mapQuadToViewCover(
  quad: Quad,
  imgW: number, imgH: number,
  viewW: number, viewH: number
) {
  const scale = Math.max(viewW / imgW, viewH / imgH);
  const drawnW = imgW * scale;
  const drawnH = imgH * scale;
  const offsetX = (viewW - drawnW) / 2;
  const offsetY = (viewH - drawnH) / 2;

  const map = (p: Pt): Pt => ({
    x: offsetX + p.x * drawnW,
    y: offsetY + p.y * drawnH
  });

  return {
    topLeft: map(quad.topLeft),
    topRight: map(quad.topRight),
    bottomRight: map(quad.bottomRight),
    bottomLeft: map(quad.bottomLeft),
  };
}

// Derive center, size and rotation angle (radians) from a mapped quad
export function quadMetrics(q: Quad) {
  const cx = (q.topLeft.x + q.topRight.x + q.bottomRight.x + q.bottomLeft.x) / 4;
  const cy = (q.topLeft.y + q.topRight.y + q.bottomRight.y + q.bottomLeft.y) / 4;

  const w = Math.hypot(q.topRight.x - q.topLeft.x, q.topRight.y - q.topLeft.y);
  const h = Math.hypot(q.bottomLeft.x - q.topLeft.x, q.bottomLeft.y - q.topLeft.y);

  const angle = Math.atan2(q.topRight.y - q.topLeft.y, q.topRight.x - q.topLeft.x);
  return {
    cx,
    cy,
    w,
    h,
    angle
  };
}

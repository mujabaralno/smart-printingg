export function ensureHiDPI(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.resetTransform?.();
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  ctx.imageSmoothingEnabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx as any).imageSmoothingQuality = "high";
  return ctx;
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h)/2));
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.lineTo(x+w-rr, y);
  ctx.arcTo(x+w, y, x+w, y+rr, rr);
  ctx.lineTo(x+w, y+h-rr);
  ctx.arcTo(x+w, y+h, x+w-rr, y+h, rr);
  ctx.lineTo(x+rr, y+h);
  ctx.arcTo(x, y+h, x, y+h-rr, rr);
  ctx.lineTo(x, y+rr);
  ctx.arcTo(x, y, x+rr, y, rr);
  ctx.closePath();
}

export function makePaperNoisePattern(
  base: CanvasRenderingContext2D, size = 64, alpha = 10
) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i=0;i<img.data.length;i+=4) {
    const n = 220 + Math.random()*35; // near white
    img.data[i] = img.data[i+1] = img.data[i+2] = n;
    img.data[i+3] = alpha; // subtle noise
  }
  ctx.putImageData(img, 0, 0);
  return base.createPattern(c, "repeat")!;
}

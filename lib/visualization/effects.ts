export function drawSoftShadow(
  ctx: CanvasRenderingContext2D,
  path: () => void,
  { blur = 16, dy = 8, alpha = 0.18 } = {}
) {
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = dy;
  ctx.globalCompositeOperation = "multiply";
  path();
  ctx.fillStyle = "rgba(0,0,0,0)"; // trigger shadow via fill/stroke
  ctx.fill();
  ctx.restore();
}

export function drawBevelStroke(
  ctx: CanvasRenderingContext2D,
  path: () => void,
  { alpha = 0.35, lw = 1.5 } = {}
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = lw;
  path();
  ctx.stroke();
  ctx.restore();
}

export function drawGlossSweep(
  ctx: CanvasRenderingContext2D,
  path: () => void,
  x1: number, y1: number, x2: number, y2: number,
  { alpha = 0.22 } = {}
) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0.0, "rgba(255,255,255,0)");
  g.addColorStop(0.48, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  path();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

export function drawSpotUV(
  ctx: CanvasRenderingContext2D,
  mask: () => void,
  { alpha = 0.15 } = {}
) {
  // efek glossy tipis pada area mask (logo/stripe)
  const { canvas } = ctx;
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, `rgba(255,255,255,${alpha * 0.1})`);
  g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, `rgba(255,255,255,${alpha * 0.1})`);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  mask();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

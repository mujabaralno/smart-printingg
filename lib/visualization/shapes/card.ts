import { roundedRectPath, makePaperNoisePattern } from "../canvas";
import { drawSoftShadow, drawBevelStroke, drawGlossSweep, drawSpotUV } from "../effects";
import { BRAND } from "../palette";

type CardOpts = {
  foil?: "gold" | "silver" | null;
  cornerRadius?: number;
  showBleed?: boolean;
  accentStripe?: boolean; // garis aksen brand
  spotUV?: boolean;       // efek glossy area logo
};

export function drawCardProduct(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: CardOpts = {}
) {
  const { foil=null, cornerRadius=10, showBleed=true, accentStripe=true, spotUV=true } = opts;

  const path = () => roundedRectPath(ctx, x, y, w, h, cornerRadius);

  // bleed
  if (showBleed) {
    ctx.save();
    ctx.fillStyle = "rgba(239,68,68,0.25)";
    roundedRectPath(ctx, x-3, y-3, w+6, h+6, cornerRadius+3);
    ctx.fill(); ctx.restore();
  }

  // paper base
  const paper = makePaperNoisePattern(ctx);
  const grad = ctx.createLinearGradient(x, y, x, y+h);
  grad.addColorStop(0, "#fff");
  grad.addColorStop(1, "#f3f3f3");

  ctx.save();
  path(); ctx.fillStyle = grad; ctx.fill();
  ctx.globalAlpha = 0.35; path(); ctx.fillStyle = paper; ctx.fill();
  ctx.restore();

  // subtle shadow & bevel
  drawSoftShadow(ctx, path, { blur: 18, dy: 10, alpha: 0.16 });
  drawBevelStroke(ctx, () => roundedRectPath(ctx, x+0.5, y+0.5, w-1, h-1, cornerRadius), { alpha: 0.22, lw: 1.25 });

  // accent stripe
  if (accentStripe) {
    ctx.save();
    ctx.fillStyle = BRAND.azure;
    ctx.fillRect(x, y + h*0.18, w, Math.max(6, h*0.08));
    ctx.globalAlpha = 0.25;
    drawGlossSweep(ctx, () => { ctx.rect(x, y + h*0.18, w, Math.max(6, h*0.08)); }, x, y, x+w, y+h);
    ctx.restore();
  }

  // foil highlight (diagonal)
  if (foil) {
    const g = ctx.createLinearGradient(x, y, x+w, y+h);
    if (foil === "gold") { g.addColorStop(0,"#8b6b00"); g.addColorStop(0.5,"#ffd54a"); g.addColorStop(1,"#8b6b00"); }
    else { g.addColorStop(0,"#7a7a7a"); g.addColorStop(0.5,"#f2f2f2"); g.addColorStop(1,"#7a7a7a"); }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.22; path(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }

  // spot-UV logotype (contoh: kotak tengah)
  if (spotUV) {
    drawSpotUV(ctx, () => {
      const mw = Math.min(w*0.5, 120), mh = Math.min(h*0.22, 40);
      ctx.beginPath(); ctx.rect(x + (w-mw)/2, y + (h-mh)/2, mw, mh); ctx.closePath();
    }, { alpha: 0.18 });
  }
}

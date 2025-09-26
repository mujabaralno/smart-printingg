/* eslint-disable @typescript-eslint/no-explicit-any */
import { drawSoftShadow, drawBevelStroke, drawGlossSweep } from "../effects";

type CupOpts = { showBleed?: boolean; curvature?: number; };

export function drawCircularProduct(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  _settings: any, _productData: any, _row?: number, _col?: number, _currentProduct?: any,
  opts: CupOpts = {}
) {
  const { showBleed = true, curvature = 0.28 } = opts;
  const taper = Math.max(0, Math.min(0.35, curvature)) * w * 0.25;
  const topW = w - taper, bottomW = w, dx = (bottomW - topW) / 2;

  // bleed
  if (showBleed) {
    ctx.save(); ctx.fillStyle = "rgba(239,68,68,0.28)";
    roundedTrap(ctx, x-3+(w-topW)/2, y-3, topW+6, bottomW+6, h+6, 8); ctx.fill(); ctx.restore();
  }

  // body
  const path = () => roundedTrap(ctx, x+(w-topW)/2, y, topW, bottomW, h, 8);
  const g = ctx.createLinearGradient(x, y, x, y+h);
  g.addColorStop(0, "rgba(255,255,255,0.98)");
  g.addColorStop(0.55, "rgba(238,238,238,0.98)");
  g.addColorStop(1, "rgba(226,226,226,0.98)");
  ctx.save(); path(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  drawBevelStroke(ctx, path, { alpha: 0.18, lw: 1 });

  // vertical highlight
  drawGlossSweep(ctx, path, x + w*0.2, y, x + w*0.55, y + h, { alpha: 0.14 });

  // rim & lid
  const rimH = Math.max(2, h*0.07);
  ellipseStroke(ctx, x + w/2, y + rimH/2, (topW/2), rimH/2, "rgba(0,0,0,0.2)");
  const lidH = rimH * 0.8;
  ellipseFill(ctx, x + w/2, y + lidH/2, (topW/2)*0.96, lidH/2, "rgba(0,0,0,0.06)");

  // base
  const baseH = Math.max(1.5, h*0.05);
  ellipseFill(ctx, x + w/2, y + h - baseH/2, (bottomW/2)*0.82, baseH/2, "rgba(0,0,0,0.08)");

  // drop shadow
  drawSoftShadow(ctx, path, { blur: 14, dy: 6, alpha: 0.14 });
}

function roundedTrap(ctx: CanvasRenderingContext2D, x:number,y:number, topW:number,bottomW:number,h:number,r=6){
  const dx = (bottomW - topW)/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+topW-r, y);
  ctx.quadraticCurveTo(x+topW, y, x+topW+r*0.6, y+r*0.6);
  ctx.lineTo(x+bottomW-dx-r*0.6, y+h-r*0.6);
  ctx.quadraticCurveTo(x+bottomW-dx, y+h, x+bottomW-dx-r, y+h);
  ctx.lineTo(x+dx+r, y+h);
  ctx.quadraticCurveTo(x+dx, y+h, x+dx, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
function ellipseStroke(ctx:CanvasRenderingContext2D,cx:number,cy:number,rx:number,ry:number,stroke:string){ ctx.save(); ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
function ellipseFill(ctx:CanvasRenderingContext2D,cx:number,cy:number,rx:number,ry:number,fill:string){ ctx.save(); ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }

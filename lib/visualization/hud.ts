export function drawUtilizationBadge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, valuePct: number
) {
  const text = `${valuePct.toFixed(1)}%`;
  const w = 64, h = 24, r = 8;
  const color =
    valuePct > 100 ? "rgba(239,68,68,0.95)" :
    valuePct > 80  ? "rgba(245,158,11,0.95)" :
                     "rgba(16,185,129,0.95)";
  const outline =
    valuePct > 100 ? "rgba(127,29,29,1)" :
    valuePct > 80  ? "rgba(120,53,15,1)" :
                     "rgba(6,95,70,1)";

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x + w/2, y + h/2);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number){
  const rr = Math.min(r, Math.min(w,h)/2);
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}

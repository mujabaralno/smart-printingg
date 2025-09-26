type BagOpts = { showBleed?: boolean };

export function drawBagDieline(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: BagOpts = {}
) {
  const { showBleed = true } = opts;
  const glue = Math.max(6, w*0.03);
  const gusset = Math.max(12, w*0.12);
  const panel = (w - glue - 2*gusset)/2;

  if (showBleed) { ctx.save(); ctx.fillStyle="rgba(239,68,68,0.22)"; ctx.fillRect(x-3,y-3,w+6,h+6); ctx.restore(); }

  // dieline base
  ctx.save();
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(17,24,39,0.25)"; ctx.lineWidth = 1.25;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.restore();

  const frontX = x + panel + gusset; // back | gusset | front | gusset | glue

  // front
  ctx.save();
  ctx.fillStyle = "#fdfdfd"; ctx.fillRect(frontX, y, panel, h);
  ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.strokeRect(frontX, y, panel, h);
  ctx.restore();

  // gusset kanan
  const gX = frontX + panel;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.04)"; ctx.fillRect(gX, y, gusset, h);
  ctx.setLineDash([6,6]);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.moveTo(gX + gusset/2, y); ctx.lineTo(gX + gusset/2, y+h); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // hem top
  const hem = Math.max(8, h*0.08);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(frontX, y, panel, hem);
  ctx.fillRect(gX, y, gusset, hem);
  ctx.restore();

  // handle
  drawHandle(ctx, frontX + panel*0.3, y+hem*0.5, panel*0.16);
  drawHandle(ctx, frontX + panel*0.7, y+hem*0.5, panel*0.16);

  // glue flap
  const glueX = x + w - glue;
  ctx.save();
  ctx.fillStyle = "rgba(250,250,250,1)";
  ctx.fillRect(glueX, y, glue, h);
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.setLineDash([4,4]); ctx.strokeRect(glueX, y, glue, h); ctx.setLineDash([]);
  ctx.restore();

  // depth lines
  ctx.save();
  ctx.globalAlpha = 0.12; ctx.fillStyle = "black";
  ctx.fillRect(frontX-2, y+hem, 2, h-hem); // sisi kiri front
  ctx.globalAlpha = 0.06; ctx.fillRect(gX-1, y+hem, 1, h-hem); // antara front & gusset
  ctx.restore();
}

function drawHandle(ctx: CanvasRenderingContext2D, cx: number, cy: number, span: number){
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+span, cy, 2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cx+span/2, cy-8, cx+span, cy);
  ctx.stroke();
  ctx.restore();
}

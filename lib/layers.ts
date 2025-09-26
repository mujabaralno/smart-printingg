// layers.ts
import { COLORS } from "./design-tokens";
import { dash } from "./canvas-utils";

export function drawPaperAndPrintable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  printableInsetTop: number, printableInsetAll: number
) {
  // sheet
  ctx.fillStyle = COLORS.paperBg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // printable (green dashed)
  ctx.save();
  ctx.strokeStyle = COLORS.printable;
  ctx.lineWidth = 1.2;
  dash(ctx, [6,4]);
  ctx.strokeRect(
    x + printableInsetAll,
    y + printableInsetTop,
    w - printableInsetAll*2,
    h - printableInsetTop - printableInsetAll
  );
  ctx.restore();

  // gripper (top strip)
  ctx.fillStyle = COLORS.gripper + "cc";
  ctx.fillRect(x, y, printableInsetAll*2 + (w - printableInsetAll*2), printableInsetTop);
}

export function drawRulers(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) {
  // top
  ctx.save();
  ctx.translate(x, y - 18);
  ctx.fillStyle = "#64748b";
  ctx.font = "11px Inter, system-ui, sans-serif";
  for (let cm=0; cm<=Math.round(w/s); cm+=5) {
    ctx.fillText(`${cm} cm`, cm*s - 8, 12);
  }
  ctx.restore();

  // left
  ctx.save();
  ctx.translate(x - 28, y);
  for (let cm=0; cm<=Math.round(h/s); cm+=5) {
    ctx.fillText(`${cm} cm`, 0, cm*s + 4);
  }
  ctx.restore();
}

export function drawLegend(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const rows = [
    ["Gripper", COLORS.gripper],
    ["Printable", COLORS.printable],
    ["Bleed", COLORS.bleed],
    ["Trim", COLORS.trim],
    ["Safe", COLORS.safe],
  ];
  ctx.save();
  ctx.translate(ox, oy);
  ctx.font = "12px Inter, system-ui, sans-serif";
  rows.forEach((r, i) => {
    ctx.fillStyle = r[1];
    ctx.fillRect(0, i*18, 14, 6);
    ctx.fillStyle = "#334155";
    ctx.fillText(r[0], 22, i*18 + 6);
  });
  ctx.restore();
}

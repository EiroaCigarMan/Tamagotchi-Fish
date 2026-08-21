import { drawText, textWidth } from "./pixelFont";
import { formatClock } from "../game/time";
import type { TimeFormat } from "../game/types";

export interface Box { x: number; y: number; w: number; h: number }

/** Standard clock panel size shared by every structure (fits "12:00" at 2× the 3×5 font). */
export const CLOCK_W = 36;
export const CLOCK_H = 12;

export const CLOCK_COLORS = {
  panel: "#141b2b",
  panelEdge: "#3a4a6a",
  glow: "#7ef9a2",
  glowDim: "#1f4d33",
  sun: "#ffd45a",
  moon: "#a9c4ff",
};

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

/** Filled circle, pixel-exact (no anti-aliasing). */
export function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string, test?: (x: number, y: number) => boolean) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const hw = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -hw; x <= hw; x++) if (!test || test(cx + x, cy + y)) ctx.fillRect(cx + x, cy + y, 1, 1);
  }
}

/**
 * Draws the glowing digital clock panel (edge + dark panel + digits) and returns the meridiem
 * ("AM" | "PM" | "") so the structure can place its sun/moon pip wherever suits it.
 */
export function drawClockPanel(ctx: CanvasRenderingContext2D, box: Box, now: Date, fmt: TimeFormat, edge = CLOCK_COLORS.panelEdge): string {
  rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, edge);
  rect(ctx, box.x, box.y, box.w, box.h, CLOCK_COLORS.panel);
  const { display, meridiem } = formatClock(now, fmt);
  const scale = 2;
  const tw = textWidth(display, scale);
  const tx = box.x + Math.floor((box.w - tw) / 2);
  const ty = box.y + 1;
  drawText(ctx, display, tx + 1, ty + 1, scale, CLOCK_COLORS.glowDim);
  drawText(ctx, display, tx, ty, scale, CLOCK_COLORS.glow);
  return meridiem;
}

/** AM = sun pip, PM = moon pip (crescent bite in `bg`). No-op in 24h mode (empty meridiem). */
export function drawMeridiemPip(ctx: CanvasRenderingContext2D, x: number, y: number, meridiem: string, bg: string) {
  if (!meridiem) return;
  rect(ctx, x - 1, y - 1, 3, 3, meridiem === "AM" ? CLOCK_COLORS.sun : CLOCK_COLORS.moon);
  if (meridiem === "PM") rect(ctx, x, y - 1, 2, 2, bg);
}

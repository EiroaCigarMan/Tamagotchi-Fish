import { CLOCK_H, CLOCK_W, drawClockPanel, drawMeridiemPip, rect } from "./clock";
import type { TimeFormat } from "../game/types";

/** Castle geometry in internal pixels (origin = top-left of the main body). */
export const CASTLE = { x: 58, y: 84, w: 44, h: 40 };
const CLOCK = { x: CASTLE.x + 4, y: CASTLE.y + 9, w: CLOCK_W, h: CLOCK_H };

const C = {
  stone: "#8d8fa3",
  stoneL: "#b5b7c9",
  stoneD: "#5c5e73",
  mortar: "#6e7088",
  dark: "#22233a",
  roof: "#c9463d",
  roofL: "#e0665a",
  sun: "#ffd45a",
};

function tower(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, bottom: number) {
  rect(ctx, x, top, w, bottom - top, C.stone);
  rect(ctx, x, top, 1, bottom - top, C.stoneL); // left highlight
  rect(ctx, x + w - 1, top, 1, bottom - top, C.stoneD); // right shade
  // battlements
  for (let i = 0; i < w; i += 2) rect(ctx, x + i, top - 2, 1, 2, C.stone);
  // window
  rect(ctx, x + Math.floor(w / 2) - 1, top + 6, 2, 3, C.dark);
  // roof cone
  const cx = x + Math.floor(w / 2);
  rect(ctx, cx - 1, top - 5, 3, 3, C.roof);
  rect(ctx, cx, top - 6, 1, 1, C.roofL);
  rect(ctx, cx, top - 8, 1, 2, C.stoneD); // pole
}

/** Draws the whole castle including the live clock. `now` = wall clock. */
export function drawCastle(ctx: CanvasRenderingContext2D, now: Date, fmt: TimeFormat): void {
  const { x, y, w, h } = CASTLE;
  // main body
  rect(ctx, x, y, w, h, C.stone);
  // brick mortar lines (subtle)
  for (let r = y + 3; r < y + h; r += 4) rect(ctx, x + 1, r, w - 2, 1, C.mortar);
  for (let r = y + 3, k = 0; r < y + h; r += 4, k++) {
    for (let c = x + (k % 2 ? 2 : 5); c < x + w - 1; c += 6) rect(ctx, c, r - 3, 1, 3, C.mortar);
  }
  // battlements on body
  for (let i = 2; i < w - 2; i += 3) rect(ctx, x + i, y - 2, 2, 2, C.stone);
  // door arch
  const dw = 8, dh = 12;
  const dx = x + Math.floor(w / 2) - dw / 2, dy = y + h - dh;
  rect(ctx, dx, dy + 2, dw, dh - 2, C.dark);
  rect(ctx, dx + 1, dy + 1, dw - 2, 1, C.dark);
  rect(ctx, dx + 2, dy, dw - 4, 1, C.dark);
  rect(ctx, dx + 3, dy + 6, 1, 1, C.sun); // door knob
  // side windows
  rect(ctx, x + 6, y + 26, 3, 4, C.dark);
  rect(ctx, x + w - 9, y + 26, 3, 4, C.dark);
  // towers
  tower(ctx, x - 6, y - 8, 8, y + h);
  tower(ctx, x + w - 2, y - 8, 8, y + h);

  // clock panel + AM/PM pip on the left tower flag position (12h only)
  const meridiem = drawClockPanel(ctx, CLOCK, now, fmt);
  drawMeridiemPip(ctx, x - 6 + 3, y - 8 - 8, meridiem, C.stone);
}

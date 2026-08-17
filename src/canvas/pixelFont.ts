/** 3x5 pixel font for the castle clock. */
export const FONT_3X5: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  ":": ["0", "1", "0", "1", "0"],
  A: ["010", "101", "111", "101", "101"],
  P: ["110", "101", "110", "100", "100"],
  M: ["101", "111", "111", "101", "101"],
};

export function textWidth(text: string, scale: number, gap = 1): number {
  let w = 0;
  for (const ch of text) {
    const g = FONT_3X5[ch];
    if (!g) continue;
    w += g[0].length * scale + gap * scale;
  }
  return Math.max(0, w - gap * scale);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
  gap = 1,
): void {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    const g = FONT_3X5[ch];
    if (!g) continue;
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] === "1") ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
      }
    }
    cx += g[0].length * scale + gap * scale;
  }
}

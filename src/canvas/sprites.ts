/** Inline pixel sprites. Each string row = pixels; '.' = transparent; letters index the palette. */
export interface PixelSprite {
  rows: string[];
  palette: Record<string, string>;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  s: PixelSprite,
  x: number,
  y: number,
  flipX = false,
  paletteOverride?: Record<string, string>,
): void {
  const pal = paletteOverride ? { ...s.palette, ...paletteOverride } : s.palette;
  const w = s.rows[0].length;
  for (let r = 0; r < s.rows.length; r++) {
    const row = s.rows[r];
    for (let c = 0; c < row.length; c++) {
      const k = row[c];
      if (k === ".") continue;
      const col = pal[k];
      if (!col) continue;
      ctx.fillStyle = col;
      const px = flipX ? x + (w - 1 - c) : x + c;
      ctx.fillRect(px, y + r, 1, 1);
    }
  }
}

export const spriteWidth = (s: PixelSprite) => s.rows[0].length;
export const spriteHeight = (s: PixelSprite) => s.rows.length;

// ---- Goldfish (faces right). 16 x 10. Two tail frames. ----
const FISH_PAL = {
  o: "#f28b1e", // orange body
  O: "#ffb347", // highlight
  d: "#c9641a", // shade / outline
  w: "#ffffff", // eye white
  k: "#1a1a2e", // pupil / outline dark
  f: "#ffd27a", // fin light
  m: "#e2571c", // mouth
};

export const FISH_FRAMES: PixelSprite[] = [
  {
    palette: FISH_PAL,
    rows: [
      "......dd........",
      ".....dOOd.......",
      "d...dOoooodd....",
      "dd.dOooooooodd..",
      "ddddoooookwood...",
      "dddooooooookoom.",
      "dd.dooooooooddd.",
      "d...doooooddd...",
      ".....dffdd......",
      "......dd........",
    ],
  },
  {
    palette: FISH_PAL,
    rows: [
      "......dd........",
      ".....dOOd.......",
      "....dOoooodd....",
      "dd.dOooooooodd..",
      "ddddoooookwood...",
      "ddddoooooookoom.",
      "dd.dooooooooddd.",
      "....doooooddd...",
      ".....dffdd......",
      "......dd........",
    ],
  },
];

/** Palette tweaks per mood — muted when sad, greenish tinge when dirty. */
export const FISH_MOOD_PALETTE: Record<string, Record<string, string>> = {
  content: {},
  sleepy: {},
  hungry: {},
  bored: { o: "#e08a3a", O: "#f0a860" },
  dirty: { o: "#c8923a", O: "#dcae60", d: "#8a6a20" },
  sad: { o: "#b8804a", O: "#c99a6a", d: "#7a5030", f: "#c9b080" },
};


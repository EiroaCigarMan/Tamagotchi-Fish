/** Inline pixel sprites. Each string row = pixels; '.' = transparent; letters index the palette. */
import type { FishMood, SpeciesId } from "../game/types";

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

/**
 * A species' look. All sprites face right. Palette letters follow one convention so mood
 * tinting and the mood overlays (droopy lid, blink, gulping mouth) work for every fish:
 *   o body · O highlight · d outline/shade · f fin · w eye white · k pupil · m mouth · a/b accents
 */
export interface SpeciesSprite {
  frames: PixelSprite[];
  /** [col,row] of the eye white in a right-facing frame (pupil is at col+1). */
  eye: [number, number];
  /** [col,row] of the mouth pixel in a right-facing frame. */
  mouth: [number, number];
}

const frames = (palette: Record<string, string>, ...rows: string[][]): PixelSprite[] => rows.map((r) => ({ palette, rows: r }));

// ---- Goldfish (16 x 10) ----
const GOLDFISH_PAL = { o: "#f28b1e", O: "#ffb347", d: "#c9641a", w: "#ffffff", k: "#1a1a2e", f: "#ffd27a", m: "#e2571c" };
const goldfish: SpeciesSprite = {
  eye: [10, 4], mouth: [14, 5],
  frames: frames(GOLDFISH_PAL,
    [
      "......dd........",
      ".....dOOd.......",
      "d...dOoooodd....",
      "dd.dOoooooood...",
      "ddddoooooowkod..",
      "dddooooooooooom.",
      "dd.dooooooooddd.",
      "d...doooooddd...",
      ".....dffdd......",
      "......dd........",
    ],
    [
      "......dd........",
      ".....dOOd.......",
      "....dOoooodd....",
      "dd.dOoooooood...",
      "ddddoooooowkod..",
      "ddddooooooooom..",
      "dd.dooooooooddd.",
      "....doooooddd...",
      ".....dffdd......",
      "......dd........",
    ],
  ),
};

// ---- Betta (18 x 12): big veil tail with blue tips ----
const BETTA_PAL = { o: "#c8344a", O: "#e85a6a", d: "#7a1f33", a: "#3b5bd6", f: "#e06b8a", w: "#ffffff", k: "#1a1a2e", m: "#ff8aa0" };
const betta: SpeciesSprite = {
  eye: [14, 3], mouth: [16, 5],
  frames: frames(BETTA_PAL,
    [
      "..........dOOd....",
      ".......ddOOooodd..",
      "..dd..doooooooood.",
      ".daad.dooooooowkod",
      "daaaaddoooooooood.",
      "daaaaaoooooooooom.",
      "daaaaddooooooooddd",
      ".daad.doooooooddd.",
      "..dd..ddoooodd....",
      "......dfffffd.....",
      ".......dffffd.....",
      "........dddd......",
    ],
    [
      "..........dOOd....",
      ".......ddOOooodd..",
      ".daad.doooooooood.",
      "daaaaddooooooowkod",
      "daaaaaoooooooooood",
      "daaaaaoooooooooom.",
      "daaaaaooooooooddd.",
      "daaaaddoooooooddd.",
      ".daad.ddoooodd....",
      "..dd..dfffffd.....",
      ".......dffffd.....",
      "........dddd......",
    ],
  ),
};

// ---- Endler's livebearer (10 x 6): orange / green / black ----
const ENDLER_PAL = { o: "#f0a830", O: "#ffd36a", d: "#4a3a10", a: "#2fbf71", b: "#1a1a2e", f: "#ffd36a", w: "#ffffff", k: "#1a1a2e", m: "#e07030" };
const endler: SpeciesSprite = {
  eye: [7, 2], mouth: [9, 3],
  frames: frames(ENDLER_PAL,
    [
      "....dOOd..",
      "d..dOoaood",
      "ddaoobowkd",
      "ddaoooooom",
      "d..doabodd",
      "....dfd...",
    ],
    [
      "....dOOd..",
      ".d.dOoaood",
      "ddaoobowkd",
      ".daoooooom",
      ".d.doabodd",
      "....dfd...",
    ],
  ),
};

// ---- Chili rasbora (8 x 5): tiny, red, dark lateral stripe ----
const CHILI_PAL = { o: "#e8503a", O: "#ff8a6a", d: "#7a2418", b: "#3a1a1a", f: "#f08a7a", w: "#ffffff", k: "#1a1a2e", m: "#ff6a5a" };
const chiliRasbora: SpeciesSprite = {
  eye: [5, 1], mouth: [7, 2],
  frames: frames(CHILI_PAL,
    [
      "...dOOd.",
      "d.doowkd",
      "ddbbbbbm",
      "d.dooodd",
      "...dfd..",
    ],
    [
      "...dOOd.",
      "..doowkd",
      "ddbbbbbm",
      "dddooodd",
      "...dfd..",
    ],
  ),
};

// ---- Scarlet badis (9 x 6): red with pale blue bars, tall fins ----
const BADIS_PAL = { o: "#d8402e", O: "#ff7a5a", d: "#6e1e14", a: "#9ad0e8", f: "#e85a4a", w: "#ffffff", k: "#1a1a2e", m: "#ff9a7a" };
const scarletBadis: SpeciesSprite = {
  eye: [6, 2], mouth: [8, 3],
  frames: frames(BADIS_PAL,
    [
      "..dfffd..",
      "d.doaoaod",
      "ddoaoawkd",
      "ddoaoaoam",
      "d.doaoadd",
      "..dfffd..",
    ],
    [
      "..dfffd..",
      ".ddoaoaod",
      "ddoaoawkd",
      "ddoaoaoam",
      ".ddoaoadd",
      "..dfffd..",
    ],
  ),
};

// ---- Pea puffer (9 x 8): round, yellow-green, dark spots, stubby tail ----
const PUFFER_PAL = { o: "#b8c84a", O: "#e4f07a", d: "#5a6a1a", b: "#3a4a10", f: "#d8e070", w: "#ffffff", k: "#1a1a2e", m: "#8a9a30" };
const peaPuffer: SpeciesSprite = {
  eye: [6, 2], mouth: [8, 3],
  frames: frames(PUFFER_PAL,
    [
      "...dOOd..",
      "..dOobood",
      "d.dooowkd",
      "ddoboooom",
      "ddoooobod",
      "d.doboood",
      "..doooodd",
      "...dddd..",
    ],
    [
      "...dOOd..",
      "d.dOobood",
      "..dooowkd",
      "ddoboooom",
      "ddoooobod",
      "..doboood",
      "d.doooodd",
      "...dddd..",
    ],
  ),
};

// ---- White Cloud Mountain minnow (10 x 5): silver-olive, pale stripe, red fins ----
const WHITECLOUD_PAL = { o: "#8a9a6a", O: "#c8d8a8", d: "#3a4a2a", a: "#e8e0a0", f: "#e04a3a", w: "#ffffff", k: "#1a1a2e", m: "#c05040" };
const whiteCloud: SpeciesSprite = {
  eye: [7, 1], mouth: [9, 2],
  frames: frames(WHITECLOUD_PAL,
    [
      "....dOOd..",
      "f.dOooowkd",
      "ffdaaaaaom",
      "f.dooooodd",
      "....dfd...",
    ],
    [
      "....dOOd..",
      ".fdOooowkd",
      "f.daaaaaom",
      ".fdooooodd",
      "....dfd...",
    ],
  ),
};

export const SPECIES_SPRITES: Record<SpeciesId, SpeciesSprite> = {
  goldfish, betta, endler, chiliRasbora, scarletBadis, peaPuffer, whiteCloud,
};

// ---- Mood tinting: mix the species' own colours toward a mood colour so every palette reacts. ----
const MOOD_TINT: Record<FishMood, { toward: string; t: number } | null> = {
  content: null,
  sleepy: null,
  hungry: null,
  bored: { toward: "#9a8a7a", t: 0.25 },
  dirty: { toward: "#6a7a20", t: 0.4 },
  sad: { toward: "#6a6a7a", t: 0.5 },
};
const TINTABLE = new Set(["o", "O", "d", "f", "a", "b", "m"]);

function mix(hex: string, toward: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const ch = (i: number) => Math.round(p(hex, i) * (1 - t) + p(toward, i) * t).toString(16).padStart(2, "0");
  return `#${ch(1)}${ch(3)}${ch(5)}`;
}

const tintCache = new Map<string, Record<string, string>>();
/** Palette override for a species in a mood (empty object when the mood doesn't tint). */
export function moodPalette(species: SpeciesId, mood: FishMood): Record<string, string> {
  const tint = MOOD_TINT[mood];
  if (!tint) return {};
  const key = `${species}:${mood}`;
  let out = tintCache.get(key);
  if (!out) {
    out = {};
    const pal = SPECIES_SPRITES[species].frames[0].palette;
    for (const [k, v] of Object.entries(pal)) if (TINTABLE.has(k)) out[k] = mix(v, tint.toward, tint.t);
    tintCache.set(key, out);
  }
  return out;
}

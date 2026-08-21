/**
 * Every structure the fish can swim around. Each one draws itself procedurally on the
 * 160×144 scene, sits on the sand (y = 124) and carries the shared glowing clock panel
 * in its lower portion. `bounds` is what the fish AI uses to decide front/behind layering.
 */
import { CASTLE, drawCastle } from "./castle";
import { type Box, CLOCK_H, CLOCK_W, disc, drawClockPanel, drawMeridiemPip, rect } from "./clock";
import type { StructureId, TimeFormat } from "../game/types";

export interface Structure {
  id: StructureId;
  /** Rectangle the fish treats as "the structure" for layer switching. */
  bounds: Box;
  draw(ctx: CanvasRenderingContext2D, now: Date, fmt: TimeFormat): void;
}

const SAND_Y = 124; // top row of the sand (structures stand on it)
const CX = 80;
const clockBox = (y: number, x = CX - CLOCK_W / 2): Box => ({ x, y, w: CLOCK_W, h: CLOCK_H });

// ---------------------------------------------------------------- Reunion Tower (Dallas)
const reunionTower: Structure = {
  id: "reunionTower",
  bounds: { x: 58, y: 48, w: 44, h: 76 },
  draw(ctx, now, fmt) {
    const C = { concrete: "#b9b6b0", concreteD: "#7e7b76", concreteL: "#e2dfd8", ball: "#3b4a5c", ballD: "#26303d", led: "#ffd45a", ledDim: "#8a6c1e", base: "#8e8a84", glassBase: "#4a5a6e" };
    // plaza base (clock lives here)
    rect(ctx, 58, 104, 44, SAND_Y - 104, C.base);
    rect(ctx, 58, 104, 44, 1, C.concreteL);
    rect(ctx, 60, 118, 40, 4, C.glassBase);
    for (let x = 62; x < 100; x += 4) rect(ctx, x, 119, 1, 2, C.concreteL);
    // three concrete columns
    for (const x of [75, 79, 83]) {
      rect(ctx, x, 64, 2, 40, C.concrete);
      rect(ctx, x + 1, 64, 1, 40, C.concreteD);
    }
    // the ball: dark sphere with a lattice of lit points
    const bx = CX, by = 58, r = 9;
    disc(ctx, bx, by, r, C.ball);
    disc(ctx, bx, by, r, C.ballD, (x, y) => x > bx + 3 || y > by + 5);
    disc(ctx, bx, by, r, C.led, (x, y) => (x + 2 * y) % 4 === 0 && Math.hypot(x - bx, y - by) < r - 0.5);
    disc(ctx, bx, by, r, C.ledDim, (x, y) => (x + 2 * y) % 4 === 2 && Math.hypot(x - bx, y - by) < r - 1.5);
    rect(ctx, bx - 1, by - r - 2, 2, 2, C.concreteD); // antenna stub
    const meridiem = drawClockPanel(ctx, clockBox(106), now, fmt);
    drawMeridiemPip(ctx, bx, by - r - 5, meridiem, C.ballD);
  },
};

// ---------------------------------------------------------------- Eiffel Tower (Paris)
const eiffelTower: Structure = {
  id: "eiffelTower",
  bounds: { x: 48, y: 40, w: 64, h: 84 },
  draw(ctx, now, fmt) {
    const C = { iron: "#6b4a2a", ironL: "#9a6f42", ironD: "#3f2a16", deck: "#8a6a3a" };
    const top = 44, bottom = SAND_Y;
    const halfAt = (y: number) => {
      // bell-shaped taper: straight-ish up top, flaring at the legs
      const t = (y - top) / (bottom - top);
      return 1 + Math.round(31 * t * t * 0.55 + 31 * t * 0.45);
    };
    for (let y = top; y <= bottom; y++) {
      const hw = halfAt(y);
      const legW = y > 106 ? Math.max(3, Math.round(hw * 0.28)) : hw; // open arch between the legs
      const inArch = y > 106;
      // left + right edges
      rect(ctx, CX - hw, y, 1, 1, C.ironL);
      rect(ctx, CX + hw, y, 1, 1, C.ironD);
      if (inArch) {
        rect(ctx, CX - hw + 1, y, legW - 1, 1, C.iron);
        rect(ctx, CX + hw - legW + 1, y, legW - 1, 1, C.iron);
        continue;
      }
      // lattice interior: sparse X-braces
      for (let x = CX - hw + 1; x < CX + hw; x++) {
        const k = (x - CX + y) & 3, j = (x - CX - y) & 3;
        if (k === 0 || j === 0) rect(ctx, x, y, 1, 1, C.iron);
      }
    }
    // arch curve (underside of the first deck)
    for (let i = 0; i < 6; i++) rect(ctx, CX - 10 + i * 4, 107 + Math.abs(i - 2.5) * 1, 3, 1, C.iron);
    // decks
    const deck = (y: number, extra: number, h: number) => {
      const hw = halfAt(y) + extra;
      rect(ctx, CX - hw, y, hw * 2 + 1, h, C.deck);
      rect(ctx, CX - hw, y, hw * 2 + 1, 1, C.ironL);
    };
    deck(68, 2, 2);
    deck(86, 3, 2);
    deck(102, 3, 3);
    // apex
    rect(ctx, CX - 1, top - 4, 3, 4, C.iron);
    rect(ctx, CX, top - 7, 1, 3, C.ironD);
    // clock on the first-floor level, between the two lower decks
    const meridiem = drawClockPanel(ctx, clockBox(89), now, fmt, C.ironL);
    drawMeridiemPip(ctx, CX, top - 10, meridiem, "#1c1730");
  },
};

// ---------------------------------------------------------------- Big Ben (London)
const bigBen: Structure = {
  id: "bigBen",
  bounds: { x: 44, y: 40, w: 70, h: 84 },
  draw(ctx, now, fmt) {
    const C = { stone: "#c9b58a", stoneL: "#e6d6ad", stoneD: "#8c7a55", roof: "#4b6b5a", roofD: "#2f4a3c", dial: "#f4ecd0", hand: "#1a1a2e", win: "#2a2340", gold: "#e2b24a" };
    // the Palace wing (clock panel lives here)
    rect(ctx, 44, 100, 56, SAND_Y - 100, C.stone);
    rect(ctx, 44, 100, 56, 1, C.stoneL);
    for (let x = 46; x < 98; x += 4) rect(ctx, x, 98, 2, 2, C.stone); // parapet
    for (let x = 48; x < 98; x += 8) { rect(ctx, x, 118, 2, 4, C.win); rect(ctx, x, 117, 2, 1, C.stoneD); }
    // the tower
    const tx = 98, tw = 16;
    rect(ctx, tx, 58, tw, SAND_Y - 58, C.stone);
    rect(ctx, tx, 58, 1, SAND_Y - 58, C.stoneL);
    rect(ctx, tx + tw - 1, 58, 1, SAND_Y - 58, C.stoneD);
    for (let y = 84; y < SAND_Y - 4; y += 8) rect(ctx, tx + 6, y, 4, 5, C.win); // lancet windows
    // belfry + spire
    rect(ctx, tx - 1, 56, tw + 2, 3, C.stoneD);
    for (let i = 0; i < 10; i++) rect(ctx, tx + 2 + Math.floor(i * 0.6), 56 - i, tw - 4 - Math.floor(i * 1.2), 1, i < 4 ? C.roof : C.roofD);
    rect(ctx, tx + tw / 2 - 1, 44, 2, 3, C.roofD);
    rect(ctx, tx + tw / 2 - 1, 42, 2, 2, C.gold);
    // the famous dial — live hands
    const cx = tx + tw / 2, cy = 70, r = 6;
    disc(ctx, cx, cy, r, C.gold);
    disc(ctx, cx, cy, r - 1, C.dial);
    const h = now.getHours() % 12, m = now.getMinutes();
    const hand = (ang: number, len: number) => {
      for (let i = 1; i <= len; i++) rect(ctx, Math.round(cx + Math.sin(ang) * i), Math.round(cy - Math.cos(ang) * i), 1, 1, C.hand);
    };
    hand(((h + m / 60) / 12) * Math.PI * 2, 3);
    hand((m / 60) * Math.PI * 2, 4);
    rect(ctx, cx, cy, 1, 1, C.hand);
    const meridiem = drawClockPanel(ctx, clockBox(104, 54), now, fmt, C.stoneD);
    drawMeridiemPip(ctx, cx, 38, meridiem, "#1c1730");
  },
};

// ---------------------------------------------------------------- Parthenon (Athens)
const parthenon: Structure = {
  id: "parthenon",
  bounds: { x: 40, y: 76, w: 80, h: 48 },
  draw(ctx, now, fmt) {
    const C = { marble: "#e8e2d0", marbleD: "#b8b09a", marbleDD: "#8a8270", shade: "#5c5648", frieze: "#c9bfa6" };
    // three steps (stylobate)
    rect(ctx, 40, 120, 80, 4, C.marbleD);
    rect(ctx, 42, 118, 76, 2, C.marble);
    rect(ctx, 44, 116, 72, 2, C.marbleD);
    // dark cella behind the columns
    rect(ctx, 46, 100, 68, 16, C.shade);
    // 8 columns with capitals
    for (let i = 0; i < 8; i++) {
      const x = 46 + i * 9;
      rect(ctx, x, 100, 4, 16, C.marble);
      rect(ctx, x + 3, 100, 1, 16, C.marbleD); // fluting shade
      rect(ctx, x - 1, 99, 6, 2, C.marble); // capital
    }
    // entablature band with the clock
    rect(ctx, 42, 86, 76, 14, C.marble);
    rect(ctx, 42, 86, 76, 1, C.marbleD);
    rect(ctx, 42, 99, 76, 1, C.marbleDD);
    for (let x = 44; x < 62; x += 4) rect(ctx, x, 90, 2, 6, C.frieze); // metopes left
    for (let x = 100; x < 118; x += 4) rect(ctx, x, 90, 2, 6, C.frieze); // metopes right
    // pediment
    for (let i = 0; i < 10; i++) {
      const hw = 39 - i * 4;
      rect(ctx, CX - hw, 85 - i, hw * 2 + 1, 1, i === 9 ? C.marbleD : C.marble);
      rect(ctx, CX - hw, 85 - i, 1, 1, C.marbleD);
    }
    const meridiem = drawClockPanel(ctx, clockBox(87), now, fmt, C.marbleDD);
    drawMeridiemPip(ctx, CX, 72, meridiem, "#1c1730");
  },
};

// ---------------------------------------------------------------- Stonehenge (Wiltshire)
const stonehenge: Structure = {
  id: "stonehenge",
  bounds: { x: 42, y: 80, w: 76, h: 44 },
  draw(ctx, now, fmt) {
    const C = { stone: "#8f8a7c", stoneL: "#b3ae9e", stoneD: "#5d594e", moss: "#5f7a45" };
    const upright = (x: number, top: number, w: number) => {
      rect(ctx, x, top, w, SAND_Y - top, C.stone);
      rect(ctx, x, top, 1, SAND_Y - top, C.stoneL);
      rect(ctx, x + w - 1, top, 1, SAND_Y - top, C.stoneD);
      rect(ctx, x + 1, SAND_Y - 2, w - 2, 1, C.moss);
    };
    const lintel = (x: number, y: number, w: number, h: number) => {
      rect(ctx, x, y, w, h, C.stone);
      rect(ctx, x, y, w, 1, C.stoneL);
      rect(ctx, x, y + h - 1, w, 1, C.stoneD);
    };
    // outer ring (smaller, further "back")
    upright(42, 104, 5); upright(51, 102, 5); lintel(41, 100, 16, 3);
    upright(113, 102, 5); upright(120, 104, 5); lintel(112, 100, 14, 3);
    // fallen stone
    rect(ctx, 104, 120, 10, 3, C.stoneD); rect(ctx, 104, 120, 10, 1, C.stone);
    // central trilithon — the clock is carved into a flat altar stone between the uprights
    upright(56, 90, 8); upright(96, 90, 8);
    lintel(55, 84, 50, 7);
    lintel(60, 98, 40, 14); // altar stone
    const meridiem = drawClockPanel(ctx, clockBox(99), now, fmt, C.stoneD);
    drawMeridiemPip(ctx, CX, 80, meridiem, "#1c1730");
  },
};

// ---------------------------------------------------------------- Pineapple (Bikini Bottom)
const pineapple: Structure = {
  id: "pineapple",
  bounds: { x: 56, y: 56, w: 48, h: 68 },
  draw(ctx, now, fmt) {
    const C = { skin: "#e8a030", skinL: "#f8c860", skinD: "#b87418", leaf: "#3f9a4a", leafL: "#6cc46e", leafD: "#2a6b33", door: "#3a5a9a", doorD: "#23407a", win: "#9ad8f0", winD: "#4a8ab0", wood: "#8a5a2a" };
    // body: ellipse rx 22, ry 22, centred (80, 104) — clipped at the sand
    const cx = CX, cy = 102, rx = 22, ry = 24;
    for (let y = cy - ry; y <= SAND_Y; y++) {
      const t = (y - cy) / ry;
      const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      if (hw <= 0) continue;
      for (let x = cx - hw; x <= cx + hw; x++) {
        const diag = (x + y) % 6 === 0 || (x - y + 600) % 6 === 0;
        rect(ctx, x, y, 1, 1, diag ? C.skinD : x < cx - hw + 3 ? C.skinL : C.skin);
      }
    }
    // leaves: a crown of spikes
    const leaf = (x0: number, h: number, lean: number, col: string) => {
      for (let i = 0; i < h; i++) {
        const w = Math.max(1, Math.round(3 - (i / h) * 2.5));
        rect(ctx, x0 + Math.round(lean * (i / h)) - Math.floor(w / 2), 80 - i, w, 1, col);
      }
    };
    leaf(66, 14, -6, C.leafD); leaf(94, 14, 6, C.leafD);
    leaf(71, 20, -4, C.leaf); leaf(89, 20, 4, C.leaf);
    leaf(76, 24, -1, C.leafL); leaf(84, 24, 1, C.leafL);
    leaf(80, 26, 0, C.leaf);
    // door
    rect(ctx, 76, 112, 8, SAND_Y - 112, C.door);
    rect(ctx, 77, 111, 6, 1, C.door); rect(ctx, 78, 110, 4, 1, C.door);
    rect(ctx, 76, 112, 1, 12, C.doorD); rect(ctx, 82, 116, 1, 1, C.skinL); // knob
    rect(ctx, 78, 113, 4, 3, C.win);
    // porthole windows
    for (const wx of [67, 93]) { disc(ctx, wx, 90, 4, C.wood); disc(ctx, wx, 90, 3, C.winD); disc(ctx, wx, 90, 2, C.win); rect(ctx, wx - 1, 88, 1, 1, "#ffffff"); }
    const meridiem = drawClockPanel(ctx, clockBox(97), now, fmt, C.wood);
    drawMeridiemPip(ctx, 80, 50, meridiem, "#1c1730");
  },
};

const castle: Structure = {
  id: "castle",
  // body + both towers (towers stick out 6px each side and rise 8px above the body)
  bounds: { x: CASTLE.x - 6, y: CASTLE.y - 8, w: CASTLE.w + 12, h: CASTLE.h + 8 },
  draw: drawCastle,
};

export const STRUCTURE_REGISTRY: Record<StructureId, Structure> = {
  castle, reunionTower, eiffelTower, bigBen, parthenon, stonehenge, pineapple,
};

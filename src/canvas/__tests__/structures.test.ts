import { describe, expect, test } from "bun:test";
import { createCanvas } from "@napi-rs/canvas";
import { STRUCTURE_REGISTRY } from "../structures";
import { STRUCTURES } from "../../game/catalog";

const paintedShare = (id: keyof typeof STRUCTURE_REGISTRY, box: { x: number; y: number; w: number; h: number }) => {
  const c = createCanvas(160, 144);
  const ctx = c.getContext("2d") as unknown as CanvasRenderingContext2D;
  STRUCTURE_REGISTRY[id].draw(ctx, new Date(2026, 0, 1, 10, 30), "12h");
  const px = (ctx as unknown as { getImageData(x: number, y: number, w: number, h: number): { data: Uint8ClampedArray } }).getImageData(box.x, box.y, box.w, box.h).data;
  let painted = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 0) painted++;
  return painted / (px.length / 4);
};

describe("structure rendering", () => {
  test("declared passages are really open (≤10% painted); every structure paints inside its bounds", () => {
    for (const s of STRUCTURES) {
      const st = STRUCTURE_REGISTRY[s.id];
      for (const p of st.passages ?? []) expect(paintedShare(s.id, p)).toBeLessThanOrEqual(0.1);
      expect(paintedShare(s.id, st.bounds)).toBeGreaterThan(0.15);
    }
  });
});

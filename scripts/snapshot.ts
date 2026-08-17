/**
 * Headless render of the bowl scene to PNG (no browser needed).
 * Usage: bun scripts/snapshot.ts [outPath] [mood] [cleanliness] [12h|24h] [seconds]
 */
import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { FishEngine, H, W } from "../src/canvas/engine";
import type { FishMood, TimeFormat } from "../src/game/types";

const [out = "snapshot.png", mood = "content", clean = "100", fmt = "12h", secs = "3"] = process.argv.slice(2);
const SCALE = 4;
const canvas = createCanvas(W, H);
// FishEngine only needs width/height/getContext — the napi canvas satisfies that.
const engine = new FishEngine(canvas as unknown as HTMLCanvasElement);
engine.setInputs({ mood: mood as FishMood, cleanliness: Number(clean), happiness: 80, timeFormat: fmt as TimeFormat });
// Drive the private loop manually with fixed steps.
type Priv = { update(dt: number): void; render(): void; feed(): void };
const p = engine as unknown as Priv;
p.feed();
const steps = Math.round(Number(secs) / (1 / 60));
for (let i = 0; i < steps; i++) p.update(1 / 60);
p.render();
// Upscale with nearest-neighbour so the PNG shows what the browser shows.
const big = createCanvas(W * SCALE, H * SCALE);
const bctx = big.getContext("2d");
bctx.imageSmoothingEnabled = false;
bctx.drawImage(canvas, 0, 0, W * SCALE, H * SCALE);
writeFileSync(out, big.toBuffer("image/png"));
console.log(`wrote ${out} (${W * SCALE}x${H * SCALE}) mood=${mood} clean=${clean} fmt=${fmt}`);

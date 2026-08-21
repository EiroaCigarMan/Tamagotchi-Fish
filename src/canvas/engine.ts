import { STRUCTURE_REGISTRY } from "./structures";
import { SPECIES_SPRITES, drawSprite, moodPalette, spriteHeight, spriteWidth } from "./sprites";
import { SPECIES_FLAVOR } from "../game/catalog";
import type { FishMood, SpeciesId, StructureId, TimeFormat } from "../game/types";

export const W = 160;
export const H = 144;

/** Bowl geometry (internal px). */
const BOWL = { cx: 80, cy: 78, r: 62, rimY: 24, waterY: 36, sandY: 124 };

type Layer = "behind" | "front";

interface Fish {
  x: number; y: number; vx: number; vy: number;
  tx: number; ty: number;
  facing: 1 | -1;
  layer: Layer;
  retargetIn: number;
  bob: number;
  frameT: number;
  dashUntil: number;
  /** Schooling: followers keep this offset from the leader (fish[0]). */
  ox: number; oy: number;
}
interface Bubble { x: number; y: number; r: number; vy: number; wob: number }
interface Pellet { x: number; y: number; vy: number; ttl: number }
interface Particle { x: number; y: number; vx: number; vy: number; ttl: number; c: string }

export interface EngineInputs {
  mood: FishMood;
  cleanliness: number;
  happiness: number;
  timeFormat: TimeFormat;
  structure: StructureId;
  species: SpeciesId;
}

const SPEED: Record<FishMood, number> = { content: 14, hungry: 12, bored: 8, dirty: 9, sad: 5, sleepy: 7 };

// Seeded PRNG for deterministic gravel.
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Half-width of the bowl circle at row y (0 if outside). */
function halfW(y: number, r = BOWL.r): number {
  const dy = y - BOWL.cy;
  const v = r * r - dy * dy;
  return v <= 0 ? 0 : Math.floor(Math.sqrt(v));
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class FishEngine {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private t = 0; // seconds since start
  private inputs: EngineInputs = { mood: "content", cleanliness: 100, happiness: 100, timeFormat: "12h", structure: "castle", species: "goldfish" };
  /** fish[0] is the leader (runs the AI); the rest school behind it. */
  private fishes: Fish[] = [];
  private get fish(): Fish { return this.fishes[0]; }
  private bubbles: Bubble[] = [];
  private pellets: Pellet[] = [];
  private particles: Particle[] = [];
  private nextBubble = 1;
  private gravel: { x: number; y: number; c: string }[] = [];
  private dirtSpecks: { x: number; y: number; ph: number }[] = [];
  private cleanFlash = 0;
  /** 1 = a painted structure pixel. Built per structure; what "overlaps the structure" really means. */
  private mask = new Uint8Array(W * H);
  private maskFor: StructureId | null = null;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.spawnSchool(this.inputs.species);
    const rnd = mulberry32(1337);
    for (let i = 0; i < 90; i++) {
      const y = BOWL.sandY + 1 + Math.floor(rnd() * (BOWL.cy + BOWL.r - BOWL.sandY - 3));
      const hw = halfW(y) - 2;
      if (hw <= 0) continue;
      const x = BOWL.cx - hw + Math.floor(rnd() * hw * 2);
      this.gravel.push({ x, y, c: ["#c9a46a", "#a67c4e", "#e0c085", "#8f6a45"][Math.floor(rnd() * 4)] });
    }
    for (let i = 0; i < 40; i++) {
      this.dirtSpecks.push({ x: rnd() * W, y: BOWL.waterY + rnd() * (BOWL.sandY - BOWL.waterY), ph: rnd() * 6.28 });
    }
  }

  setInputs(i: EngineInputs) {
    const speciesChanged = i.species !== this.inputs.species;
    this.inputs = i;
    if (speciesChanged) this.spawnSchool(i.species);
    if (this.maskFor !== i.structure) this.buildMask(i.structure);
  }

  /** Render the structure alone and keep its alpha as an occupancy mask (the next frame overwrites the canvas anyway). */
  private buildMask(id: StructureId) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    STRUCTURE_REGISTRY[id].draw(ctx, new Date(), this.inputs.timeFormat);
    const data = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < W * H; i++) this.mask[i] = data[i * 4 + 3] > 0 ? 1 : 0;
    this.maskFor = id;
  }

  /** (Re)create the fish for a species — one leader plus followers if it schools. */
  private spawnSchool(species: SpeciesId) {
    const n = SPECIES_FLAVOR[species].school;
    const mk = (ox: number, oy: number): Fish => ({
      x: 50 + ox, y: 70 + oy, vx: 0, vy: 0, tx: 100, ty: 60, facing: 1, layer: "front",
      retargetIn: 2, bob: rand(0, 6.28), frameT: rand(0, 2), dashUntil: 0, ox, oy,
    });
    this.fishes = [mk(0, 0)];
    for (let i = 1; i < n; i++) {
      const ang = (i / (n - 1)) * Math.PI * 2;
      this.fishes.push(mk(Math.round(-6 - Math.cos(ang) * 7 - i * 2), Math.round(Math.sin(ang) * 6)));
    }
  }

  private get sprite() { return SPECIES_SPRITES[this.inputs.species]; }

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000));
      this.last = now;
      this.t += dt;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { cancelAnimationFrame(this.raf); }

  // ---------- events from React ----------
  feed() {
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const y = BOWL.waterY + 1;
      const hw = halfW(y) - 6;
      this.pellets.push({ x: BOWL.cx + rand(-hw, hw), y: y - rand(0, 3), vy: rand(9, 16), ttl: 12 });
    }
  }
  play() {
    for (const f of this.fishes) f.dashUntil = this.t + 4.5;
    this.fish.retargetIn = 0;
    for (let i = 0; i < 6; i++) this.spawnBubble(this.fish.x + rand(-4, 4), this.fish.y);
  }
  clean() {
    this.cleanFlash = 1;
    for (let i = 0; i < 40; i++) {
      const y = rand(BOWL.waterY + 2, BOWL.sandY - 2);
      const hw = halfW(y) - 3;
      this.particles.push({ x: BOWL.cx + rand(-hw, hw), y, vx: rand(-3, 3), vy: rand(-12, -4), ttl: rand(0.6, 1.4), c: "#e8fbff" });
    }
  }

  private spawnBubble(x: number, y: number) {
    this.bubbles.push({ x, y, r: Math.random() < 0.3 ? 2 : 1, vy: rand(10, 18), wob: rand(0, 6.28) });
  }

  // ---------- simulation ----------
  private inWater(x: number, y: number, margin: number): boolean {
    if (y < BOWL.waterY + margin || y > BOWL.sandY - margin) return false;
    const hw = halfW(y) - margin;
    return Math.abs(x - BOWL.cx) <= hw;
  }
  private randomTarget(): [number, number] {
    for (let i = 0; i < 20; i++) {
      const y = rand(BOWL.waterY + 8, BOWL.sandY - 8);
      const hw = halfW(y) - 12;
      const x = BOWL.cx + rand(-hw, hw);
      if (this.inWater(x, y, 10)) return [x, y];
    }
    return [BOWL.cx, BOWL.cy];
  }
  /** True if any fish in the school sits over a painted structure pixel (so a layer flip never pops). */
  private overlapsStructure(): boolean {
    if (this.maskFor !== this.inputs.structure) this.buildMask(this.inputs.structure);
    const fr = this.sprite.frames[0];
    const fw = spriteWidth(fr), fh = spriteHeight(fr);
    return this.fishes.some((f) => {
      const x0 = Math.max(0, Math.floor(f.x - fw / 2) - 1), x1 = Math.min(W - 1, Math.ceil(f.x + fw / 2) + 1);
      const y0 = Math.max(0, Math.floor(f.y - fh / 2) - 2), y1 = Math.min(H - 1, Math.ceil(f.y + fh / 2) + 2);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.mask[y * W + x]) return true;
      return false;
    });
  }

  private update(dt: number) {
    const f = this.fish;
    const mood = this.inputs.mood;
    const dashing = this.t < f.dashUntil;
    const speed = (dashing ? 34 : SPEED[mood]) * SPECIES_FLAVOR[this.inputs.species].speed;

    // Hungry fish chases pellets.
    let target: [number, number] | null = null;
    if (this.pellets.length && (mood === "hungry" || mood === "sad" || Math.random() < 0.9)) {
      let best: Pellet | null = null, bd = Infinity;
      for (const p of this.pellets) {
        const d = (p.x - f.x) ** 2 + (p.y - f.y) ** 2;
        if (d < bd) { bd = d; best = p; }
      }
      if (best) target = [best.x, best.y];
    }
    if (target) { f.tx = target[0]; f.ty = target[1]; }
    else {
      f.retargetIn -= dt;
      const arrived = Math.hypot(f.tx - f.x, f.ty - f.y) < 4;
      if (f.retargetIn <= 0 || arrived) {
        const clear = !this.overlapsStructure();
        const passages = STRUCTURE_REGISTRY[this.inputs.structure].passages;
        const fr = this.sprite.frames[0];
        const fw = spriteWidth(fr), fh = spriteHeight(fr);
        // Open structures: about a third of the time, swim through an opening (always drawn behind
        // the structure so its edges frame the fish). Only when the school is clear or already behind, so it never pops.
        const allBehind = this.fishes.every((s) => s.layer === "behind");
        const through = passages?.length && (clear || allBehind) && !dashing && Math.random() < 0.35
          ? passages[Math.floor(Math.random() * passages.length)] : null;
        if (through && through.w >= fw && through.h >= fh) {
          f.tx = rand(through.x + fw / 2, through.x + through.w - fw / 2);
          f.ty = rand(through.y + fh / 2, through.y + through.h - fh / 2);
          f.retargetIn = rand(3, 6);
          for (const s of this.fishes) s.layer = "behind";
        } else {
          [f.tx, f.ty] = this.randomTarget();
          f.retargetIn = dashing ? rand(0.6, 1.2) : rand(2.5, 6);
          if (clear) for (const s of this.fishes) s.layer = Math.random() < 0.45 ? "behind" : "front";
        }
      }
    }
    // Followers aim at their slot beside the leader (with a little wobble so the school breathes).
    for (let i = 1; i < this.fishes.length; i++) {
      const s = this.fishes[i];
      s.tx = f.x + s.ox * (f.facing === 1 ? 1 : -1) + Math.sin(this.t * 1.3 + i) * 2;
      s.ty = f.y + s.oy + Math.cos(this.t * 1.1 + i * 2) * 2;
    }
    // Steering (every fish)
    for (const s of this.fishes) {
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      const sp = s === f ? speed : Math.min(speed * 1.4, speed * 0.5 + dist * 1.2);
      const ax = (dx / dist) * sp, ay = (dy / dist) * sp;
      const ease = dashing ? 6 : 2.2;
      s.vx += (ax - s.vx) * Math.min(1, ease * dt);
      s.vy += (ay - s.vy) * Math.min(1, ease * dt);
      if (mood === "sad" || mood === "sleepy") s.vy += 3 * dt; // gentle sink
      let nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
      if (!this.inWater(nx, ny, 8)) { // bounce back toward center
        s.vx *= -0.5; s.vy *= -0.5;
        nx = s.x + (BOWL.cx - s.x) * 0.02; ny = s.y + (BOWL.cy - s.y) * 0.02;
        s.retargetIn = 0;
      }
      s.x = nx; s.y = ny;
      if (Math.abs(s.vx) > 1.5) s.facing = s.vx > 0 ? 1 : -1;
      s.bob += dt * (mood === "sad" ? 1.2 : 2.5);
      s.frameT += dt * (dashing ? 14 : mood === "sad" ? 3 : 7);
    }

    // Eat pellets (any fish in the school can eat)
    this.pellets = this.pellets.filter((p) => {
      p.y += p.vy * dt; p.ttl -= dt;
      p.vy = Math.max(6, p.vy - 4 * dt);
      const eater = this.fishes.find((s) => Math.abs(p.x - s.x) < 7 && Math.abs(p.y - s.y) < 6);
      if (eater) this.spawnBubble(eater.x + eater.facing * 6, eater.y - 2);
      return !eater && p.ttl > 0 && p.y < BOWL.sandY - 1;
    });

    // Bubbles
    this.nextBubble -= dt;
    if (this.nextBubble <= 0) {
      const happy = this.inputs.happiness / 100;
      this.nextBubble = rand(1.2, 4) * (1.6 - happy);
      const y = BOWL.sandY - 2;
      const hw = halfW(y) - 6;
      this.spawnBubble(BOWL.cx + rand(-hw, hw), y);
    }
    this.bubbles = this.bubbles.filter((b) => {
      b.y -= b.vy * dt; b.wob += dt * 4;
      b.x += Math.sin(b.wob) * 4 * dt;
      return b.y > BOWL.waterY + 1;
    });
    // Particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.ttl -= dt;
      return p.ttl > 0;
    });
    this.cleanFlash = Math.max(0, this.cleanFlash - dt * 1.2);
  }

  // ---------- rendering ----------
  private render() {
    const ctx = this.ctx;
    const dirt = 1 - this.inputs.cleanliness / 100; // 0 clean … 1 filthy
    // room background
    ctx.fillStyle = "#1c1730";
    ctx.fillRect(0, 0, W, H);
    // table
    ctx.fillStyle = "#3b2a2a"; ctx.fillRect(0, BOWL.cy + BOWL.r - 2, W, H);
    ctx.fillStyle = "#4e3838"; ctx.fillRect(0, BOWL.cy + BOWL.r - 2, W, 2);

    // glass back (slightly lighter than room) + water + sand, row by row for crisp circle
    for (let y = BOWL.rimY; y <= BOWL.cy + BOWL.r; y++) {
      const hw = halfW(y);
      if (hw <= 0) continue;
      const x0 = BOWL.cx - hw, wdt = hw * 2 + 1;
      // glass wall (2px) + interior
      ctx.fillStyle = "#c8ecf7"; ctx.fillRect(x0, y, wdt, 1);
      const inner = hw - 2;
      if (inner > 0) {
        let col: string;
        if (y < BOWL.waterY) col = "#2a2542"; // air inside bowl
        else if (y >= BOWL.sandY) col = "#d8b374"; // sand
        else {
          // water gradient by depth, tinted by dirt
          const depth = (y - BOWL.waterY) / (BOWL.sandY - BOWL.waterY);
          const r = Math.round(40 + 40 * dirt + depth * 10);
          const g = Math.round(120 - depth * 30 + 40 * dirt);
          const b = Math.round(200 - depth * 60 - 110 * dirt);
          col = `rgb(${r},${g},${b})`;
        }
        ctx.fillStyle = col; ctx.fillRect(BOWL.cx - inner, y, inner * 2 + 1, 1);
      }
    }
    // rim
    { const hw = halfW(BOWL.rimY); ctx.fillStyle = "#e8f8ff"; ctx.fillRect(BOWL.cx - hw - 2, BOWL.rimY - 2, hw * 2 + 5, 2);
      ctx.fillStyle = "#9fd3e6"; ctx.fillRect(BOWL.cx - hw - 2, BOWL.rimY, hw * 2 + 5, 1); }
    // water surface line + shimmer
    { const hw = halfW(BOWL.waterY) - 2; ctx.fillStyle = "#bfefff"; ctx.fillRect(BOWL.cx - hw, BOWL.waterY, hw * 2 + 1, 1);
      ctx.fillStyle = "#e6fbff";
      for (let i = 0; i < 5; i++) { const x = BOWL.cx - hw + 6 + ((i * 17 + Math.floor(this.t * 6)) % (hw * 2 - 10)); ctx.fillRect(x, BOWL.waterY, 3, 1); } }
    // gravel
    for (const g of this.gravel) { ctx.fillStyle = g.c; ctx.fillRect(g.x, g.y, 1, 1); }

    // plants (behind)
    this.plant(45, BOWL.sandY, 22, "#2f8f4f", "#5cc47a", 0);
    this.plant(114, BOWL.sandY, 24, "#2a7a45", "#4fb56b", 1.3);

    // fish behind the structure
    for (const s of this.fishes) if (s.layer === "behind") this.drawFish(s);
    // structure + clock
    STRUCTURE_REGISTRY[this.inputs.structure].draw(ctx, new Date(), this.inputs.timeFormat);
    // fish in front
    for (const s of this.fishes) if (s.layer === "front") this.drawFish(s);

    // pellets
    ctx.fillStyle = "#b8783a";
    for (const p of this.pellets) ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    // bubbles
    for (const b of this.bubbles) {
      const x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillStyle = "#dff6ff";
      if (b.r === 1) ctx.fillRect(x, y, 1, 1);
      else { ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 1, 1, 1); }
    }
    // front plant
    this.plant(104, BOWL.sandY + 3, 12, "#3a9c58", "#7ee39a", 2.1);

    // dirt specks (only when quite dirty)
    if (dirt > 0.6) {
      const n = Math.floor((dirt - 0.6) / 0.4 * this.dirtSpecks.length);
      ctx.fillStyle = "rgba(90,110,40,0.85)";
      for (let i = 0; i < n; i++) {
        const s = this.dirtSpecks[i];
        const x = s.x + Math.sin(this.t * 0.7 + s.ph) * 3, y = s.y + Math.cos(this.t * 0.5 + s.ph) * 2;
        if (this.inWater(x, y, 3)) ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    // clean sparkles
    for (const p of this.particles) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    if (this.cleanFlash > 0) {
      ctx.fillStyle = `rgba(230,255,255,${(this.cleanFlash * 0.35).toFixed(3)})`;
      for (let y = BOWL.waterY; y < BOWL.sandY; y++) { const hw = halfW(y) - 2; ctx.fillRect(BOWL.cx - hw, y, hw * 2 + 1, 1); }
    }
    // glass shine (front)
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let y = BOWL.rimY + 8; y < BOWL.rimY + 40; y++) { const hw = halfW(y); ctx.fillRect(BOWL.cx - hw + 3, y, 2, 1); }
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let y = BOWL.rimY + 44; y < BOWL.rimY + 60; y++) { const hw = halfW(y); ctx.fillRect(BOWL.cx - hw + 5, y, 1, 1); }
  }

  /** Draw a 1px-wide run clipped to the inside of the glass on row y. */
  private waterRect(x: number, y: number, w: number, c: string) {
    const hw = halfW(y) - 3;
    if (hw <= 0) return;
    const x0 = Math.max(x, BOWL.cx - hw), x1 = Math.min(x + w, BOWL.cx + hw + 1);
    if (x1 <= x0) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(x0, y, x1 - x0, 1);
  }

  private plant(x: number, baseY: number, h: number, dark: string, light: string, phase: number) {
    for (let i = 0; i < h; i++) {
      const y = baseY - i;
      const sway = Math.round(Math.sin(this.t * 1.5 + phase + i * 0.25) * (i / h) * 2);
      this.waterRect(x + sway, y, 2, i % 5 === 4 ? light : dark);
      if (i % 4 === 1 && i > 3) this.waterRect(x + sway - 2, y, 2, light);
      if (i % 4 === 3 && i > 3) this.waterRect(x + sway + 2, y, 2, light);
    }
  }

  private drawFish(f: Fish) {
    const sp = this.sprite;
    const n = sp.frames.length;
    const frame = sp.frames[((Math.floor(f.frameT) % n) + n) % n];
    const w = spriteWidth(frame), h = spriteHeight(frame);
    const bob = Math.round(Math.sin(f.bob) * 1.5);
    const x = Math.round(f.x - w / 2), y = Math.round(f.y - h / 2) + bob;
    const mood = this.inputs.mood;
    const pal = moodPalette(this.inputs.species, mood);
    drawSprite(this.ctx, frame, x, y, f.facing === -1, pal);
    // mood details drawn over the sprite at the species' eye / mouth pixels
    const col = (c: number) => (f.facing === 1 ? x + c : x + (w - 1 - c));
    const [ec, er] = sp.eye, [mc, mr] = sp.mouth;
    const ex = Math.min(col(ec), col(ec + 1)), ey = y + er;
    this.ctx.fillStyle = pal.d ?? frame.palette.d;
    if (mood === "sad" || mood === "bored") this.ctx.fillRect(ex, ey - 1, 2, 1); // droopy lid
    if (mood === "sleepy" && Math.floor(this.t * 0.8) % 3 === 0) this.ctx.fillRect(ex, ey, 2, 1); // blink
    if (mood === "hungry" && Math.floor(this.t * 3) % 2 === 0) { // gulping mouth
      this.ctx.fillStyle = pal.m ?? frame.palette.m; this.ctx.fillRect(col(mc), y + mr + 1, 1, 1);
    }
  }
}

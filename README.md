# 🐠 tamagotchi-fish

A cozy, 8-bit goldfish tamagotchi that lives in your browser. Feed it, play with it, keep its bowl clean — and read the time off the little castle it swims around.

- Pixel-art scene rendered on a 160×144 `<canvas>` (scaled up crisp), React for the panels.
- Stats **Full / Happy / Clean** decay in real time — including while the tab is closed (computed from the last-seen timestamp on load).
- The fish never dies; low stats just change its mood, speed, and the water colour.
- Castle clock shows the current time in **12h or 24h** (toggle in Settings, persisted).
- Everything is stored in `localStorage`. Fully static: `dist/` deploys anywhere.

## Run it

Requires Node ≥ 20 **or** Bun. No other setup, no accounts, no backend.

```bash
# with bun
bun install
bun run dev        # http://localhost:5173

# or with npm
npm install
npm run dev
```

Production build → `dist/` (static, host it anywhere):

```bash
bun run build      # or: npm run build
bun run preview    # serve dist/ locally
```

## Scripts

| Script | What |
|---|---|
| `dev` | Vite dev server with HMR |
| `build` | Type-check + production bundle to `dist/` |
| `preview` | Serve the production bundle |
| `test` | Unit tests for decay / actions / mood / clock (`bun test`) |
| `snapshot` | Render one frame of the bowl to a PNG without a browser: `bun run snapshot out.png [mood] [cleanliness] [12h\|24h] [seconds]` |

## How it works

```
src/
  game/      pure state: types, constants (decay rates, action effects, cooldowns),
             state.ts (applyDecay / applyAction), mood.ts, storage.ts, time.ts,
             useFishGame.ts (React hook that owns state, ticks decay, persists)
  canvas/    the scene: engine.ts (loop, fish AI, bubbles, pellets, water tint),
             castle.ts (castle + pixel clock), pixelFont.ts, sprites.ts (fish frames)
  components/ FishCanvas (mounts the engine), StatsPanel, ActionsPanel, SettingsPanel
```

- **Decay** (per real hour): Full −6, Happy −4, Clean −2.5. Full → empty ≈ 16 h.
- **Actions**: Feed +28 full · Play +24 happy · Clean +40 clean (with small side effects and 6/10/15 s cooldowns, enforced in state, not just the UI).
- **Mood** is derived from stats, never stored: sad → dirty → hungry → bored → sleepy → content.
- The fish picks random waypoints inside the water, chases food when you feed it, and switches between swimming **behind** and **in front of** the castle only when it's clear of it (so it never pops).

## Verify offline decay yourself

Open DevTools → Application → Local Storage → `tamagotchi-fish:v1`, set `lastSeenAt` to a timestamp a day ago, reload.

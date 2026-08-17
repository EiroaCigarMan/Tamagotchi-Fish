# Plan (as built)

`PLAN_codex.md` is the initial plan produced by OpenAI Codex (gpt-5.5). This file lists what was kept and what was corrected while building.

## Kept
- Folder split `game/` (pure state) vs `canvas/` (visual only) vs `components/`.
- 160×144 internal canvas, CSS `image-rendering: pixelated`, `performance.now()` for frames / `Date.now()` for state.
- Decay-from-`lastSeenAt` offline algorithm, clamp on negative elapsed time, schema-versioned localStorage with coercion fallback.
- Mood priority table, mood-based speed, cooldowns enforced in state.
- 3×5 pixel font for the clock; no AM/PM text on the castle.

## Corrected
- **Mood is not persisted.** Codex stored `fish.mood` in state; it is derived (`getMood`) so it can never go stale.
- **Decay rates softened** for a "cozy, never dies" pet: 6/4/2.5 per hour instead of 8/5/3.
- **Cooldowns shortened** (6/10/15 s) — the plan's 8/12/20 s made feeding feel sluggish.
- **Castle is drawn procedurally** (rects), not a hand-typed 44×40 ASCII sprite — easier to keep pixel-perfect and to place the clock panel.
- **AM/PM shown as a sun/moon pip** on the left tower in 12h mode (the plan dropped meridiem entirely on the castle); the Settings panel shows it as text.
- **Layer switching (behind/in-front of castle) only when the fish is clear of the castle**, so it never pops through it.
- **`act()` reports cooldown refusal synchronously** via a state ref (the plan's closure-in-updater pattern is unreliable under StrictMode).
- Added `scripts/snapshot.ts` (headless PNG render via `@napi-rs/canvas`) and `bun test` unit tests — neither in the plan.

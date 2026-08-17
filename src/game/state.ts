import { ACTION_COOLDOWN_MS, ACTION_EFFECTS, DECAY_PER_HOUR } from "./constants";
import type { ActionName, GameState, StatName, TimeFormat } from "./types";

export const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

export function defaultState(now = Date.now()): GameState {
  return {
    schemaVersion: 1,
    hunger: 80,
    happiness: 75,
    cleanliness: 85,
    lastSeenAt: now,
    lastActionAt: { feed: null, play: null, clean: null },
    timeFormat: "12h",
    fishName: "Goldie",
    createdAt: now,
  };
}

/** Pure: apply real-time decay from lastSeenAt to `now`. Safe against clock going backwards. */
export function applyDecay(state: GameState, now: number): GameState {
  const hours = Math.max(0, now - state.lastSeenAt) / 3_600_000;
  if (hours <= 0) return state;
  return {
    ...state,
    hunger: clamp(state.hunger - hours * DECAY_PER_HOUR.hunger),
    happiness: clamp(state.happiness - hours * DECAY_PER_HOUR.happiness),
    cleanliness: clamp(state.cleanliness - hours * DECAY_PER_HOUR.cleanliness),
    lastSeenAt: now,
  };
}

export function cooldownRemaining(state: GameState, action: ActionName, now: number): number {
  const last = state.lastActionAt[action];
  if (last == null) return 0;
  return Math.max(0, last + ACTION_COOLDOWN_MS[action] - now);
}

/** Pure: apply an action. Cooldown is enforced here (not only in the UI). Returns same object if refused. */
export function applyAction(state: GameState, action: ActionName, now: number): GameState {
  if (cooldownRemaining(state, action, now) > 0) return state;
  const decayed = applyDecay(state, now);
  const next: GameState = { ...decayed, lastActionAt: { ...decayed.lastActionAt, [action]: now } };
  for (const [stat, delta] of Object.entries(ACTION_EFFECTS[action]) as [StatName, number][]) {
    next[stat] = clamp(next[stat] + delta);
  }
  return next;
}

export function setTimeFormat(state: GameState, timeFormat: TimeFormat): GameState {
  return { ...state, timeFormat };
}

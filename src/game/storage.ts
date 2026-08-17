import { STORAGE_KEY } from "./constants";
import { applyDecay, clamp, defaultState } from "./state";
import type { GameState } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Validate + repair a parsed blob; unknown/corrupt → null. */
function coerce(raw: unknown, now: number): GameState | null {
  if (!isRecord(raw) || raw.schemaVersion !== 1) return null;
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  const d = defaultState(now);
  const la = isRecord(raw.lastActionAt) ? raw.lastActionAt : {};
  const ts = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    schemaVersion: 1,
    hunger: clamp(num(raw.hunger, d.hunger)),
    happiness: clamp(num(raw.happiness, d.happiness)),
    cleanliness: clamp(num(raw.cleanliness, d.cleanliness)),
    lastSeenAt: num(raw.lastSeenAt, now),
    lastActionAt: { feed: ts(la.feed), play: ts(la.play), clean: ts(la.clean) },
    timeFormat: raw.timeFormat === "24h" ? "24h" : "12h",
    fishName: typeof raw.fishName === "string" && raw.fishName.trim() ? raw.fishName.slice(0, 20) : d.fishName,
    createdAt: num(raw.createdAt, now),
  };
}

/** Load and apply offline decay. Falls back to a fresh fish on missing/corrupt data. */
export function loadState(now = Date.now()): GameState {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return defaultState(now);
    const parsed = coerce(JSON.parse(text), now);
    return parsed ? applyDecay(parsed, now) : defaultState(now);
  } catch {
    return defaultState(now);
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

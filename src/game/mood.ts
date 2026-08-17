import type { FishMood, GameState } from "./types";

/** Mood is derived from stats — never stored. Order = priority. */
export function getMood(s: Pick<GameState, "hunger" | "happiness" | "cleanliness">): FishMood {
  if (s.hunger < 25 && s.happiness < 25) return "sad";
  if (s.cleanliness < 25) return "dirty";
  if (s.hunger < 30) return "hungry";
  if (s.happiness < 30) return "bored";
  if (s.hunger < 45 || s.happiness < 45) return "sleepy";
  return "content";
}

export const MOOD_LABEL: Record<FishMood, string> = {
  content: "Content",
  hungry: "Hungry",
  bored: "Bored",
  dirty: "Grumpy (dirty water)",
  sad: "Sad",
  sleepy: "Sleepy",
};

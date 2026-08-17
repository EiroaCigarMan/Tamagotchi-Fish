export type StatName = "hunger" | "happiness" | "cleanliness";
export type ActionName = "feed" | "play" | "clean";
export type TimeFormat = "12h" | "24h";

export type FishMood = "content" | "hungry" | "bored" | "dirty" | "sad" | "sleepy";

export interface GameState {
  schemaVersion: 1;
  hunger: number; // 0-100, higher = fuller
  happiness: number;
  cleanliness: number;
  lastSeenAt: number;
  lastActionAt: Record<ActionName, number | null>;
  timeFormat: TimeFormat;
  fishName: string;
  createdAt: number;
}

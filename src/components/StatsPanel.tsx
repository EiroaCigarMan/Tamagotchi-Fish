import type { GameState, StatName } from "../game/types";
import { MOOD_LABEL } from "../game/mood";
import type { FishMood } from "../game/types";

const STATS: { key: StatName; label: string; icon: string }[] = [
  { key: "hunger", label: "Full", icon: "🍔" },
  { key: "happiness", label: "Happy", icon: "😊" },
  { key: "cleanliness", label: "Clean", icon: "🫧" },
];

const MOOD_FACE: Record<FishMood, string> = { content: "😊", hungry: "😋", bored: "😑", dirty: "🤢", sad: "😢", sleepy: "😴" };

export function StatsPanel({ state, mood }: { state: GameState; mood: FishMood }) {
  return (
    <section className="panel" aria-labelledby="stats-h">
      <h2 id="stats-h" className="panel-title">
        {state.fishName} <span className="mood" title={MOOD_LABEL[mood]}>{MOOD_FACE[mood]} {MOOD_LABEL[mood]}</span>
      </h2>
      <ul className="stats">
        {STATS.map(({ key, label, icon }) => {
          const v = Math.round(state[key]);
          const tone = v < 25 ? "low" : v < 45 ? "mid" : "ok";
          return (
            <li key={key} className="stat">
              <span className="stat-label">{icon} {label}</span>
              <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}>
                <div className={`meter-fill ${tone}`} style={{ width: `${v}%` }} />
              </div>
              <span className="stat-val">{v}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { cooldownRemaining } from "../game/state";
import type { ActionName, GameState } from "../game/types";

const ACTIONS: { key: ActionName; label: string; icon: string; hint: string }[] = [
  { key: "feed", label: "Feed", icon: "🥫", hint: "Drop some flakes" },
  { key: "play", label: "Play", icon: "🎈", hint: "Zoomies!" },
  { key: "clean", label: "Clean", icon: "🧽", hint: "Fresh water" },
];

/** Feed / Play / Clean buttons. Rendered inside the tabbed SidePanel. */
export function ActionsPanel({ state, now, onAct }: { state: GameState; now: number; onAct: (a: ActionName) => void }) {
  return (
    <div className="actions">
      {ACTIONS.map(({ key, label, icon, hint }) => {
        const cd = cooldownRemaining(state, key, now);
        const secs = Math.ceil(cd / 1000);
        return (
          <button key={key} className="btn" onClick={() => onAct(key)} disabled={cd > 0} title={hint} aria-label={cd > 0 ? `${label} (ready in ${secs}s)` : label}>
            <span className="btn-icon" aria-hidden>{icon}</span>
            <span>{cd > 0 ? `${secs}s` : label}</span>
          </button>
        );
      })}
    </div>
  );
}

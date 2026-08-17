import { useMemo, useRef } from "react";
import { ActionsPanel } from "./components/ActionsPanel";
import { FishCanvas, type FishCanvasHandle } from "./components/FishCanvas";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { useFishGame } from "./game/useFishGame";
import type { ActionName } from "./game/types";

export default function App() {
  const { state, now, mood, act, setTimeFormat, reset } = useFishGame();
  const canvasRef = useRef<FishCanvasHandle>(null);

  const inputs = useMemo(
    () => ({ mood, cleanliness: state.cleanliness, happiness: state.happiness, timeFormat: state.timeFormat }),
    [mood, state.cleanliness, state.happiness, state.timeFormat],
  );

  const onAct = (a: ActionName) => {
    if (act(a)) canvasRef.current?.[a]();
  };

  return (
    <main className="app">
      <header className="hdr">
        <h1>🐠 tamagotchi-fish</h1>
        <p className="sub">a tiny goldfish who lives in your browser</p>
      </header>
      <div className="layout">
        <FishCanvas ref={canvasRef} {...inputs} />
        <aside className="side">
          <StatsPanel state={state} mood={mood} />
          <ActionsPanel state={state} now={now} onAct={onAct} />
          <SettingsPanel timeFormat={state.timeFormat} now={now} onTimeFormat={setTimeFormat} onReset={reset} />
        </aside>
      </div>
    </main>
  );
}

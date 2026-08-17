import { useMemo, useRef, useState } from "react";
import { ActionsPanel } from "./components/ActionsPanel";
import { FishCanvas, type FishCanvasHandle } from "./components/FishCanvas";
import { NameDialog } from "./components/NameDialog";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { useFishGame } from "./game/useFishGame";
import type { ActionName } from "./game/types";

export default function App() {
  const { state, now, mood, act, setTimeFormat, setFishName, reset } = useFishGame();
  const [renaming, setRenaming] = useState(false);
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
          <SettingsPanel timeFormat={state.timeFormat} now={now} onTimeFormat={setTimeFormat} onReset={reset} onRename={() => setRenaming(true)} />
        </aside>
      </div>
      {!state.fishName && <NameDialog title="A new goldfish! What's its name?" onSubmit={setFishName} />}
      {state.fishName && renaming && (
        <NameDialog title="Rename your fish" initial={state.fishName} onSubmit={(n) => { setFishName(n); setRenaming(false); }} onCancel={() => setRenaming(false)} />
      )}
    </main>
  );
}

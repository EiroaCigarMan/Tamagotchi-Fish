import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { FishEngine, H, W, type EngineInputs } from "../canvas/engine";

export interface FishCanvasHandle {
  feed(): void;
  play(): void;
  clean(): void;
}

export const FishCanvas = forwardRef<FishCanvasHandle, EngineInputs>(function FishCanvas(inputs, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FishEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new FishEngine(canvas);
    engineRef.current = engine;
    engine.setInputs(inputs);
    engine.start();
    return () => {
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setInputs(inputs);
  }, [inputs]);

  useImperativeHandle(ref, () => ({
    feed: () => engineRef.current?.feed(),
    play: () => engineRef.current?.play(),
    clean: () => engineRef.current?.clean(),
  }));

  return (
    <div className="bowl-frame">
      <canvas ref={canvasRef} width={W} height={H} className="bowl-canvas" aria-label="Goldfish bowl" role="img" />
    </div>
  );
});

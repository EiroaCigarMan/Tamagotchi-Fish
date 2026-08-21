import { useState } from "react";
import { SPECIES, STRUCTURES, speciesInfo } from "../game/catalog";
import type { SpeciesId, StructureId } from "../game/types";

/**
 * Structure + fish pickers. Structure swaps instantly (cosmetic). Picking a different
 * species starts a new fish, so it asks first.
 */
export function TankPanel({ structure, species, onStructure, onSpecies }: {
  structure: StructureId; species: SpeciesId; onStructure: (s: StructureId) => void; onSpecies: (s: SpeciesId) => void;
}) {
  const [pending, setPending] = useState<SpeciesId | null>(null);
  return (
    <>
      <h3 className="sub-title">Structure</h3>
      <div className="picker" role="radiogroup" aria-label="Structure">
        {STRUCTURES.map((s) => (
          <button key={s.id} role="radio" aria-checked={structure === s.id} title={s.blurb}
            className={`pick ${structure === s.id ? "on" : ""}`} onClick={() => onStructure(s.id)}>
            <span className="pick-icon" aria-hidden>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <h3 className="sub-title">Fish</h3>
      <div className="picker" role="radiogroup" aria-label="Fish species">
        {SPECIES.map((s) => (
          <button key={s.id} role="radio" aria-checked={species === s.id} title={s.blurb}
            className={`pick ${species === s.id ? "on" : ""}`} onClick={() => s.id !== species && setPending(s.id)}>
            <span className="pick-icon" aria-hidden>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      {pending && (
        <div className="row confirm" role="alertdialog" aria-live="polite">
          <span>Switch to a {speciesInfo(pending).label}? That starts a new fish — stats and name reset.</span>
          <span className="seg">
            <button className="seg-btn danger" onClick={() => { onSpecies(pending); setPending(null); }}>Yes, new fish</button>
            <button className="seg-btn" onClick={() => setPending(null)}>Cancel</button>
          </span>
        </div>
      )}
    </>
  );
}

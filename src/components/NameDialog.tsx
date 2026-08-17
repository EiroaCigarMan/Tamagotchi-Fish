import { useState, type FormEvent } from "react";
import { MAX_NAME_LEN } from "../game/state";

export function NameDialog({ initial = "", title, onSubmit, onCancel }: {
  initial?: string; title: string; onSubmit: (name: string) => void; onCancel?: () => void;
}) {
  const [name, setName] = useState(initial);
  const valid = name.trim().length > 0;
  const submit = (e: FormEvent) => { e.preventDefault(); if (valid) onSubmit(name); };
  return (
    <div className="modal-backdrop" role="presentation">
      <form className="panel modal" role="dialog" aria-modal="true" aria-labelledby="name-h" onSubmit={submit}>
        <h2 id="name-h" className="panel-title">{title}</h2>
        <label className="field">
          <span>Name</span>
          <input autoFocus className="input" value={name} maxLength={MAX_NAME_LEN} placeholder="e.g. Goldie"
            onChange={(e) => setName(e.target.value)} aria-describedby="name-hint" />
        </label>
        <p id="name-hint" className="hint">Up to {MAX_NAME_LEN} characters. You can rename later in Settings.</p>
        <div className="seg" style={{ justifyContent: "flex-end" }}>
          {onCancel && <button type="button" className="seg-btn" onClick={onCancel}>Cancel</button>}
          <button type="submit" className="seg-btn on" disabled={!valid}>OK</button>
        </div>
      </form>
    </div>
  );
}

import { useState, type ReactNode } from "react";

export type TabId = "care" | "tank" | "settings";
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "care", label: "Care", icon: "🥫" },
  { id: "tank", label: "Tank", icon: "🏰" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

/** One panel, three tabs — Care (Feed / Play / Clean), Tank (structure + fish), Settings. */
export function SidePanel({ tabs }: { tabs: Record<TabId, ReactNode> }) {
  const [tab, setTab] = useState<TabId>("care");
  return (
    <section className="panel" aria-label="Controls">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`tabpanel-${t.id}`}
            className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-body">
        {tabs[tab]}
      </div>
    </section>
  );
}

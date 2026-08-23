"use client";

import { useState } from "react";

type Panel = "spot" | "top" | "board";

const TABS: Array<{ key: Panel; label: string }> = [
  { key: "spot", label: "Spot" },
  { key: "top", label: "Top 3" },
  { key: "board", label: "Board" },
];

/**
 * Arranges the live surfaces. Desktop is one composed screen: The Spot beside
 * the Top 3 rail, with the Board window running underneath. Small screens get
 * the same surfaces one at a time behind a tab switcher instead of a long
 * scroll. The panels arrive server-rendered as props; this component only
 * decides what is visible where.
 */
export function LiveMain({
  spot,
  top,
  board,
}: {
  spot: React.ReactNode;
  top: React.ReactNode;
  board: React.ReactNode;
}) {
  const [active, setActive] = useState<Panel>("spot");

  const shown = (panel: Panel) => (active === panel ? "flex" : "hidden");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="Live surfaces" className="flex border-b border-rule lg:hidden">
        {TABS.map((tab) => {
          const selected = active === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={`flex-1 border-b-2 px-3 py-2.5 font-mono text-[0.6875rem] font-600 tracking-[0.14em] uppercase transition-colors ${
                selected
                  ? "border-signal text-ink"
                  : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto]">
        <section
          aria-label="The Spot"
          className={`${shown("spot")} min-h-0 flex-1 flex-col lg:col-span-8 lg:row-start-1 lg:flex lg:border-r lg:border-rule`}
        >
          {spot}
        </section>

        <section
          aria-label="Top 3"
          className={`${shown("top")} min-h-0 flex-1 flex-col overflow-y-auto lg:col-span-4 lg:row-start-1 lg:flex`}
        >
          {top}
        </section>

        <section
          aria-label="The Board"
          className={`${shown("board")} min-h-0 flex-1 flex-col overflow-y-auto lg:col-span-12 lg:row-start-2 lg:flex lg:overflow-visible lg:border-t-[1.5px] lg:border-ink`}
        >
          {board}
        </section>
      </div>
    </div>
  );
}

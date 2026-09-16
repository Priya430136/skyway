import { useEffect, useState } from "react";
import { getSnapshot, resetAnalytics, subscribe, type AnalyticsEvent } from "@/lib/analytics";

const LABELS: Record<AnalyticsEvent, string> = {
  search_submitted: "Searches",
  search_result_clicked: "Itinerary clicks",
  cta_demo_clicked: "Demo CTA",
  cta_nav_clicked: "Nav CTA",
  capability_card_clicked: "Capability cards",
  demo_form_submitted: "Forms sent",
  demo_form_error: "Form errors",
  platform_tab_selected: "Platform tabs",
  platform_page_opened: "Page details",
  platform_design_prompt_copied: "Prompts copied",
};

export function KpiOverlay() {
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState(() => getSnapshot());

  useEffect(() => subscribe(() => setSnap(getSnapshot())), []);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {open ? (
        <div className="w-72 rounded-2xl border border-sky-dark/10 bg-white p-4 shadow-2xl shadow-sky-dark/20">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-sky-accent">
                Live KPIs
              </div>
              <div className="font-display text-sm font-medium text-sky-dark">
                Landing interactions
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-sky-dark/40 hover:bg-sky-surface hover:text-sky-dark"
              aria-label="Close KPI panel"
            >
              ×
            </button>
          </div>
          <ul className="space-y-1.5 text-sm">
            {(Object.keys(LABELS) as AnalyticsEvent[]).map((k) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-sky-dark/60">{LABELS[k]}</span>
                <span className="font-display font-semibold tabular-nums text-sky-dark">
                  {snap.counts[k] ?? 0}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={resetAnalytics}
            className="mt-4 w-full rounded-md border border-sky-dark/10 py-2 text-[10px] font-bold uppercase tracking-widest text-sky-dark/60 hover:border-sky-accent hover:text-sky-accent"
          >
            Reset session
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-sky-dark px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl shadow-sky-dark/30 hover:bg-sky-accent"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-accent" />
          KPIs
        </button>
      )}
    </div>
  );
}

// Lightweight client-side analytics for landing page interactions.
// Events are mirrored to console (for ops debugging) and kept in localStorage
// as a small KPI counter that the KpiOverlay component reads.

export type AnalyticsEvent =
  | "search_submitted"
  | "search_result_clicked"
  | "cta_demo_clicked"
  | "cta_nav_clicked"
  | "capability_card_clicked"
  | "demo_form_submitted"
  | "demo_form_error"
  | "platform_tab_selected"
  | "platform_page_opened"
  | "platform_design_prompt_copied";

export interface EventPayload {
  [key: string]: string | number | boolean | undefined;
}

const STORAGE_KEY = "skyway:analytics:v1";
const LISTENERS = new Set<() => void>();

interface Snapshot {
  counts: Record<AnalyticsEvent, number>;
  lastEvents: Array<{ name: AnalyticsEvent; at: number; props?: EventPayload }>;
}

const empty = (): Snapshot => ({
  counts: {
    search_submitted: 0,
    search_result_clicked: 0,
    cta_demo_clicked: 0,
    cta_nav_clicked: 0,
    capability_card_clicked: 0,
    demo_form_submitted: 0,
    demo_form_error: 0,
    platform_tab_selected: 0,
    platform_page_opened: 0,
    platform_design_prompt_copied: 0,
  },
  lastEvents: [],
});

function read(): Snapshot {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Snapshot) };
  } catch {
    return empty();
  }
}

function write(snapshot: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota errors */
  }
  LISTENERS.forEach((l) => l());
}

export function track(name: AnalyticsEvent, props?: EventPayload) {
  // Always log — useful for QA in console.
  console.info("[analytics]", name, props ?? {});
  if (typeof window === "undefined") return;
  const snap = read();
  snap.counts[name] = (snap.counts[name] ?? 0) + 1;
  snap.lastEvents = [
    { name, at: Date.now(), props },
    ...snap.lastEvents,
  ].slice(0, 20);
  write(snap);
}

export function getSnapshot(): Snapshot {
  return read();
}

export function subscribe(fn: () => void): () => void {
  LISTENERS.add(fn);
  return () => LISTENERS.delete(fn);
}

export function resetAnalytics() {
  write(empty());
}

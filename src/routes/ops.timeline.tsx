import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { flightsQuery } from "@/lib/ops/queries";

const STAGES = ["scheduled", "boarding", "taxi", "takeoff", "cruise", "landing", "completed", "delayed", "cancelled"] as const;
const STAGE_COLORS: Record<string, string> = {
  scheduled: "#94a3b8", boarding: "#10b981", taxi: "#0ea5e9", takeoff: "#3b82f6",
  cruise: "#0A1F44", landing: "#6366f1", completed: "#059669", delayed: "#f59e0b", cancelled: "#ef4444",
};

export const Route = createFileRoute("/ops/timeline")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(flightsQuery); },
  component: Timeline,
});

function Timeline() {
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const [airport, setAirport] = useState("all");

  const airports = Array.from(new Set(flights.flatMap((f) => [f.origin, f.destination]))).sort();
  const filtered = useMemo(
    () => flights.filter((f) => airport === "all" || f.origin === airport || f.destination === airport),
    [flights, airport],
  );

  const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
  const dayMs = 24 * 3600 * 1000;

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Timeline" }]} />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Flight timeline</h1>
            <p className="text-sm text-muted-foreground">Every flight today across the network — filter by airport.</p>
          </div>
          <select value={airport} onChange={(e) => setAirport(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <option value="all">All airports</option>
            {airports.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          {STAGES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded" style={{ background: STAGE_COLORS[s] }} /> {s}</span>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/40 px-4 py-2">
            <div className="ml-32 grid grid-cols-24 text-[10px] font-semibold text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
              {Array.from({ length: 24 }, (_, h) => <div key={h}>{String(h).padStart(2, "0")}</div>)}
            </div>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((f) => {
              const depTime = new Date(f.scheduled_dep).getTime();
              const arrTime = new Date(f.scheduled_arr).getTime();
              const startPct = Math.max(0, ((depTime - startOfDay.getTime()) / dayMs) * 100);
              const widthPct = Math.min(100 - startPct, ((arrTime - depTime) / dayMs) * 100);
              return (
                <li key={f.id} className="flex items-center px-4 py-2 hover:bg-muted/30">
                  <div className="w-32 shrink-0">
                    <div className="font-mono text-xs font-semibold">{f.flight_no}</div>
                    <div className="text-[10px] text-muted-foreground">{f.origin}→{f.destination}</div>
                  </div>
                  <div className="relative h-6 flex-1 rounded bg-muted/60">
                    <div
                      className="absolute top-0 flex h-full items-center overflow-hidden rounded px-2 text-[10px] font-semibold text-white shadow"
                      style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 4)}%`, background: STAGE_COLORS[f.status] ?? "#94a3b8" }}
                      title={`${f.status} · ${f.delay_minutes}m delay`}
                    >
                      {f.status}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { aircraftQuery, flightsQuery } from "@/lib/ops/queries";
import { Fuel, Clock, Plane } from "lucide-react";

export const Route = createFileRoute("/ops/gates")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(aircraftQuery);
    context.queryClient.ensureQueryData(flightsQuery);
  },
  component: Gates,
});

function Gates() {
  const { data: aircraft } = useSuspenseQuery(aircraftQuery);
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const withGates = flights.filter((f) => f.gate);

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Gates & Fleet" }]} />
      <main className="flex-1 space-y-6 p-6">
        <h1 className="font-display text-3xl tracking-tight">Gate assignment & fleet</h1>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Gate board</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {withGates.map((f) => (
              <div key={f.id} draggable className="cursor-grab rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-sky-accent/60 hover:shadow-md active:cursor-grabbing">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-lg font-bold">{f.gate}</div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="mt-2 text-xs">
                  <div className="font-semibold">{f.flight_no} · {f.origin}→{f.destination}</div>
                  <div className="text-muted-foreground">{f.aircraft_tail ?? "unassigned"} · {new Date(f.scheduled_dep).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fleet</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>{["Tail", "Model", "Status", "Fuel", "Hours", "Base", "Next assignment"].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aircraft.map((a) => (
                  <tr key={a.tail} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-semibold">{a.tail}</td>
                    <td className="px-4 py-3">{a.model}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full ${a.fuel_level > 60 ? "bg-emerald-500" : a.fuel_level > 30 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${a.fuel_level}%` }} />
                        </div>
                        <span className="text-xs font-mono">{a.fuel_level}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{a.hours_flown.toLocaleString()}h</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.base}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.next_assignment ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

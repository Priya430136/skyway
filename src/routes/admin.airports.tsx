import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { airports } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/airports")({ component: AirportsPage });

function AirportsPage() {
  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "Airports" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Airport management</h1>
          <p className="text-sm text-muted-foreground">Terminals, gates, runways, and lounges across the network.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {airports.map((a) => (
            <div key={a.code} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-2xl tracking-tight">{a.code}</div>
                  <div className="text-xs text-muted-foreground">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">{a.city}, {a.country}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  a.status === "operating" ? "bg-emerald-500/15 text-emerald-500" :
                  a.status === "restricted" ? "bg-amber-500/15 text-amber-500" :
                  "bg-red-500/15 text-red-500"
                }`}>{a.status}</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-muted-foreground">Terminals</dt><dd className="mt-0.5 font-mono">{a.terminals}</dd></div>
                <div><dt className="text-muted-foreground">Gates</dt><dd className="mt-0.5 font-mono">{a.gates}</dd></div>
                <div><dt className="text-muted-foreground">Runways</dt><dd className="mt-0.5 font-mono">{a.runways}</dd></div>
                <div><dt className="text-muted-foreground">Lounges</dt><dd className="mt-0.5 font-mono">{a.lounges}</dd></div>
              </dl>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Operational capacity</span><span className="font-mono">{a.capacity}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${a.capacity > 90 ? "bg-red-500" : a.capacity > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${a.capacity}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

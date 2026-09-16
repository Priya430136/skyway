import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { notificationsQuery } from "@/lib/ops/queries";

export const Route = createFileRoute("/ops/notifications")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(notificationsQuery); },
  component: Notifications,
});

const TYPES = ["all", "delay", "weather", "gate", "aircraft", "crew", "airport", "system"];

function Notifications() {
  const { data: notifs } = useSuspenseQuery(notificationsQuery);
  const [type, setType] = useState("all");
  const filtered = type === "all" ? notifs : notifs.filter((n) => n.type === type);

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Notifications" }]} />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Notification center</h1>
            <p className="text-sm text-muted-foreground">Real-time operational alerts across the network.</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)} className={`rounded-full border px-3 py-1 text-xs capitalize ${type === t ? "border-sky-accent bg-sky-accent/10 text-sky-accent" : "border-border text-muted-foreground hover:bg-muted"}`}>{t}</button>
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {filtered.map((n) => (
            <li key={n.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                n.severity === "critical" ? "bg-red-500" :
                n.severity === "high" ? "bg-orange-500" :
                n.severity === "medium" ? "bg-amber-400" :
                n.severity === "low" ? "bg-sky-400" : "bg-muted-foreground"
              }`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{n.type}</span>
                  <StatusBadge status={n.severity} />
                  {n.flight_no && <span className="font-mono text-xs">{n.flight_no}</span>}
                  {n.airport_code && <span className="font-mono text-xs text-muted-foreground">· {n.airport_code}</span>}
                </div>
                <div className="mt-1 text-sm font-semibold">{n.title}</div>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
              <button className="self-start rounded-md border border-border px-3 py-1 text-xs hover:bg-muted">Acknowledge</button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

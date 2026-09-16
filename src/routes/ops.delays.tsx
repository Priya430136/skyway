import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingDown, Users, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { delaysQuery, flightsQuery } from "@/lib/ops/queries";

export const Route = createFileRoute("/ops/delays")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(delaysQuery);
    context.queryClient.ensureQueryData(flightsQuery);
  },
  component: Delays,
});

function Delays() {
  const { data: delays } = useSuspenseQuery(delaysQuery);
  const { data: flights } = useSuspenseQuery(flightsQuery);

  const totalMin = delays.reduce((s, d) => s + d.minutes, 0);
  const affected = delays.reduce((s, d) => s + d.affected_passengers, 0);
  const revenue = delays.reduce((s, d) => s + Number(d.revenue_impact), 0);
  const cancelled = flights.filter((f) => f.status === "cancelled").length;

  const trend = Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    delayed: Math.round(8 + Math.sin(i) * 4 + Math.random() * 3),
    cancelled: Math.round(1 + Math.random() * 2),
  }));

  const heatmap = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}`,
    minutes: Math.round(15 + Math.abs(Math.sin(h / 3)) * 40 + (h > 15 && h < 20 ? 30 : 0)),
  }));

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Delays & Cancellations" }]} />
      <main className="flex-1 space-y-6 p-6">
        <h1 className="font-display text-3xl tracking-tight">Delays & cancellations</h1>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Total delay minutes" value={totalMin} delta={-4.2} icon={AlertTriangle} tone="warning" />
          <KpiCard label="Cancellations" value={cancelled} delta={0} icon={TrendingDown} tone="danger" />
          <KpiCard label="Affected passengers" value={affected.toLocaleString()} delta={-2.1} icon={Users} />
          <KpiCard label="Revenue impact" value={`$${(revenue / 1000).toFixed(0)}k`} delta={-3.4} icon={DollarSign} tone="warning" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">7-day trend</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line dataKey="delayed" stroke="#f59e0b" strokeWidth={2} />
                  <Line dataKey="cancelled" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Delay heatmap · today (UTC)</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <BarChart data={heatmap}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fontSize: 11 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="minutes" fill="#0A1F44" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4"><h3 className="font-display text-lg">Active delay events</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>{["Flight", "Reason", "Minutes", "Passengers", "Revenue impact", "Status"].map((h) => <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {delays.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono font-semibold">{d.flight_no}</td>
                  <td className="px-5 py-3 text-muted-foreground">{d.reason}</td>
                  <td className="px-5 py-3 font-semibold text-amber-500">+{d.minutes}m</td>
                  <td className="px-5 py-3">{d.affected_passengers}</td>
                  <td className="px-5 py-3">${Number(d.revenue_impact).toLocaleString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.recovery_status ?? "in-progress"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

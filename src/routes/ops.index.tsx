import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plane, PlaneTakeoff, AlertTriangle, Ban, Split, Wrench, Building2, Timer,
  Download, Plus, X, CheckCircle2, FileText, Send, Sparkles, Copy,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { flightsQuery, airportsQuery, aircraftQuery, notificationsQuery, delaysQuery } from "@/lib/ops/queries";

export const Route = createFileRoute("/ops/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(flightsQuery);
    context.queryClient.ensureQueryData(airportsQuery);
    context.queryClient.ensureQueryData(aircraftQuery);
    context.queryClient.ensureQueryData(notificationsQuery);
    context.queryClient.ensureQueryData(delaysQuery);
  },
  component: OpsDashboard,
});

const spark = (base: number, seed = 0) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin((i + seed) * 0.7) * base * 0.15 + (i - 6) * 0.6));

function OpsDashboard() {
  const navigate = useNavigate();
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const { data: airports } = useSuspenseQuery(airportsQuery);
  const { data: aircraft } = useSuspenseQuery(aircraftQuery);
  const { data: notifs } = useSuspenseQuery(notificationsQuery);
  const { data: delays } = useSuspenseQuery(delaysQuery);

  const [briefingOpen, setBriefingOpen] = useState(false);
  const [disruptionModalOpen, setDisruptionModalOpen] = useState(false);

  // New Disruption Plan form state
  const [newPlan, setNewPlan] = useState({
    flight_no: flights[0]?.flight_no ?? "SW102",
    reason: "Severe convective weather front holding arrival slots",
    minutes: 45,
    affected_pax: 184,
    revenue_impact: 16500,
    strategy: "Tail swap + Priority departure slot",
    auto_rebook: true,
    notify_pax: true,
  });

  const total = flights.length;
  const active = flights.filter((f) => f.status === "in-flight" || f.status === "boarding").length;
  const delayed = flights.filter((f) => f.status === "delayed").length;
  const cancelled = flights.filter((f) => f.status === "cancelled").length;
  const diversions = 0;
  const available = aircraft.filter((a) => a.status === "available").length;
  const airportsOp = airports.filter((a) => a.status === "operating").length;
  const otp = Math.round(((total - delayed - cancelled) / Math.max(total, 1)) * 100);

  const delayByReason = delays.reduce<Record<string, number>>((acc, d) => {
    const key = d.reason.split(" ").slice(0, 3).join(" ");
    acc[key] = (acc[key] ?? 0) + d.minutes;
    return acc;
  }, {});
  const delayData = Object.entries(delayByReason).map(([name, minutes]) => ({ name, minutes }));

  const perfTrend = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    otp: Math.round(80 + Math.sin(h / 3) * 8 + Math.random() * 3),
    delayed: Math.round(3 + Math.abs(Math.sin(h / 4)) * 4),
  }));

  const cabinMix = [
    { name: "Economy", value: flights.filter((f) => f.cabin === "economy").length, fill: "hsl(220 30% 60%)" },
    { name: "Mixed", value: flights.filter((f) => f.cabin === "mixed").length, fill: "hsl(220 80% 55%)" },
    { name: "Business", value: flights.filter((f) => f.cabin === "business").length, fill: "hsl(42 75% 55%)" },
  ];

  const handleDownloadBriefing = () => {
    const briefingText = `SKYWAY AIRLINES — OPERATIONS CONTROL CENTER (OCC)
DAILY EXECUTIVE BRIEFING
Generated: ${new Date().toUTCString()}
----------------------------------------------------------------------
NETWORK SNAPSHOT
Total Flights Scheduled: ${total}
Active Flights in Air: ${active}
Delayed Flights: ${delayed}
Cancelled Flights: ${cancelled}
Fleet in Service: ${available}/${aircraft.length} aircraft
Operational Hubs: ${airportsOp}/${airports.length} hubs
System On-Time Performance (OTP): ${otp}%
----------------------------------------------------------------------
ACTIVE DISRUPTIONS & DELAYS
${delays.map((d, i) => `${i + 1}. Flight ${d.flight_no} (+${d.minutes}m) — Reason: ${d.reason} | Affected Pax: ${d.affected_passengers}`).join("\n")}
----------------------------------------------------------------------
OCC CONTROLLER RECOMMENDATIONS:
- Maintain slot swaps at congested hubs (LHR / HKG).
- Standby reserve crew staged at FRA base.
- Pre-approved EU261 / DGCA vouchers for delays exceeding 120 minutes.
----------------------------------------------------------------------
Duty Manager: OCC Lead Dispatcher (Badge #OCC-9021)`;

    const blob = new Blob([briefingText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay_OCC_Briefing_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Operations briefing exported successfully!");
  };

  const handleCreateDisruptionPlan = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Disruption Recovery Plan created for ${newPlan.flight_no}! Dispatched to OCC recovery queue.`, {
      action: {
        label: "View in AI Manager",
        onClick: () => navigate({ to: "/ops/ai" }),
      },
    });
    setDisruptionModalOpen(false);
  };

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Dashboard" }]} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-accent">Network Overview</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">Operations Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live network state across {airports.length} airports · updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBriefingOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-sky-accent" />
              Export briefing
            </button>
            <button
              type="button"
              onClick={() => setDisruptionModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              New disruption plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
          <KpiCard label="Flights Today" value={total} delta={2.4} icon={Plane} trend={spark(total, 1)} />
          <KpiCard label="Active Flights" value={active} delta={4.1} icon={PlaneTakeoff} trend={spark(active, 2)} tone="positive" />
          <KpiCard label="Delayed" value={delayed} delta={-1.2} icon={AlertTriangle} trend={spark(delayed, 3)} tone="warning" />
          <KpiCard label="Cancelled" value={cancelled} delta={0} icon={Ban} trend={spark(cancelled + 1, 4)} tone="danger" />
          <KpiCard label="Diversions" value={diversions} delta={-100} icon={Split} trend={spark(1, 5)} tone="positive" />
          <KpiCard label="Aircraft Available" value={`${available}/${aircraft.length}`} delta={0.5} icon={Wrench} trend={spark(available, 6)} />
          <KpiCard label="Airports Operating" value={`${airportsOp}/${airports.length}`} delta={0} icon={Building2} trend={spark(airportsOp, 7)} />
          <KpiCard label="On-Time Performance" value={`${otp}%`} delta={1.8} icon={Timer} trend={spark(otp, 8)} tone={otp >= 85 ? "positive" : "warning"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg">Network Performance · 24h</h3>
                <p className="text-xs text-muted-foreground">On-time percentage vs. delayed flights per hour (UTC)</p>
              </div>
              <div className="flex gap-3 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-accent" />OTP</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Delayed</span>
              </div>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <AreaChart data={perfTrend}>
                  <defs>
                    <linearGradient id="otp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3DA5F5" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3DA5F5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area dataKey="otp" stroke="#3DA5F5" strokeWidth={2} fill="url(#otp)" />
                  <Area dataKey="delayed" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Cabin mix today</h3>
            <p className="text-xs text-muted-foreground">Configured routes by product</p>
            <div className="mt-2 h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cabinMix} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {cabinMix.map((c, i) => <Cell key={i} fill={c.fill} />)}
                  </Pie>
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Delay contributors</h3>
              <span className="text-[11px] text-muted-foreground">Minutes attributed by cause</span>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <BarChart data={delayData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="minutes" fill="#0A1F44" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Live disruption feed</h3>
            <ul className="mt-4 space-y-3">
              {notifs.slice(0, 5).map((n) => (
                <li key={n.id} className="flex gap-3 border-l-2 border-sky-accent/60 pl-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <StatusBadge status={n.severity} />
                      <span className="truncate font-semibold">{n.title}</span>
                    </div>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Export Briefing Modal */}
      {briefingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setBriefingOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-accent">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Operations Control Briefing</span>
            </div>
            <h2 className="mt-1 font-display text-2xl">Daily Network Operations Report</h2>
            <p className="text-xs text-muted-foreground">Live telemetry snapshot · {new Date().toUTCString()}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-xs">
              <div>
                <span className="text-muted-foreground">OTP Rate</span>
                <div className="font-mono text-base font-bold text-emerald-500">{otp}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Active in Air</span>
                <div className="font-mono text-base font-bold text-sky-accent">{active} flights</div>
              </div>
              <div>
                <span className="text-muted-foreground">Delayed Sectors</span>
                <div className="font-mono text-base font-bold text-amber-500">{delayed}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-4 text-xs font-mono">
              <div className="font-bold text-foreground">Active Delay Incidents ({delays.length})</div>
              {delays.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border/50 py-1 last:border-none">
                  <span>{d.flight_no} · {d.reason}</span>
                  <span className="text-amber-500 font-bold">+{d.minutes}m ({d.affected_passengers} pax)</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`SkyWay OCC Briefing: ${total} flights scheduled, ${active} in air, ${otp}% OTP, ${delayed} delayed.`);
                  toast.success("Briefing summary copied to clipboard!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy text
              </button>
              <button
                type="button"
                onClick={handleDownloadBriefing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                Download Briefing (.TXT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Disruption Plan Modal */}
      {disruptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setDisruptionModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-accent">
              <Sparkles className="h-5 w-5 text-sky-gold" />
              <span className="text-xs font-bold uppercase tracking-wider">SkyWay Recovery Engine</span>
            </div>
            <h2 className="mt-1 font-display text-2xl">Draft Disruption Recovery Plan</h2>
            <p className="text-xs text-muted-foreground">Coordinate aircraft tail swap, passenger accommodation, and ATC slot buffering.</p>

            <form onSubmit={handleCreateDisruptionPlan} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Affected Flight</label>
                  <select
                    value={newPlan.flight_no}
                    onChange={(e) => setNewPlan({ ...newPlan, flight_no: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  >
                    {flights.map((f) => (
                      <option key={f.id} value={f.flight_no}>{f.flight_no} ({f.origin} → {f.destination})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Estimated Delay (Minutes)</label>
                  <input
                    type="number"
                    value={newPlan.minutes}
                    onChange={(e) => setNewPlan({ ...newPlan, minutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Disruption Root Cause / Reason</label>
                <input
                  type="text"
                  value={newPlan.reason}
                  onChange={(e) => setNewPlan({ ...newPlan, reason: e.target.value })}
                  placeholder="e.g. Convective weather cell over arrival FIR"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Impacted Passengers</label>
                  <input
                    type="number"
                    value={newPlan.affected_pax}
                    onChange={(e) => setNewPlan({ ...newPlan, affected_pax: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Est. Revenue / Cost Impact ($)</label>
                  <input
                    type="number"
                    value={newPlan.revenue_impact}
                    onChange={(e) => setNewPlan({ ...newPlan, revenue_impact: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Recommended Recovery Action</label>
                <select
                  value={newPlan.strategy}
                  onChange={(e) => setNewPlan({ ...newPlan, strategy: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="Tail swap + Priority departure slot">Tail swap with standby aircraft + Priority ATC slot</option>
                  <option value="Direct flight reroute via southern airway">Direct flight reroute via southern airway</option>
                  <option value="Hold connection waves 25 minutes">Hold connection waves 25 minutes</option>
                  <option value="Passenger re-accommodation on partner flights">Passenger re-accommodation on partner flights</option>
                  <option value="Issue instant hotel & meal vouchers">Issue instant hotel & meal vouchers</option>
                </select>
              </div>

              <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.auto_rebook}
                    onChange={(e) => setNewPlan({ ...newPlan, auto_rebook: e.target.checked })}
                    className="rounded"
                  />
                  <span>Automate rebooking for connecting passengers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.notify_pax}
                    onChange={(e) => setNewPlan({ ...newPlan, notify_pax: e.target.checked })}
                    className="rounded"
                  />
                  <span>Broadcast instant SMS/WhatsApp updates to passengers</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setDisruptionModalOpen(false)}
                  className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 font-semibold text-white hover:opacity-90"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-gold" />
                  Dispatch Recovery Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


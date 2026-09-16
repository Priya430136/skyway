import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Sparkles, Plane, Clock, DollarSign, Users, CheckCircle2, AlertTriangle,
  CloudRain, Wrench, UserCheck, Building2, Radio, Fuel, Shield, TrendingUp,
  TrendingDown, Search, Filter, Download, Eye, ArrowRight, Send, Bot,
  FileText, Activity, Star, HeartHandshake, RefreshCcw, Gauge, Zap, Timer,
  Ban, MapPin, ChevronRight, X, Sliders, Check, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { delaysQuery, flightsQuery, notificationsQuery } from "@/lib/ops/queries";

export const Route = createFileRoute("/ops/ai")({
  head: () => ({
    meta: [
      { title: "AI Flight Disruption Manager · SkyWay OCC" },
      { name: "description", content: "Detect, analyze, predict and recover from flight disruptions with SkyWay's AI decision engine." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(delaysQuery);
    context.queryClient.ensureQueryData(flightsQuery);
    context.queryClient.ensureQueryData(notificationsQuery);
  },
  component: AiDisruption,
});

const DISRUPTION_TYPES: Record<string, { label: string; icon: typeof CloudRain; color: string }> = {
  weather: { label: "Weather", icon: CloudRain, color: "text-sky-500" },
  technical: { label: "Aircraft Technical", icon: Wrench, color: "text-orange-500" },
  crew: { label: "Crew Availability", icon: UserCheck, color: "text-purple-500" },
  congestion: { label: "Airport Congestion", icon: Building2, color: "text-amber-500" },
  atc: { label: "Air Traffic", icon: Radio, color: "text-indigo-500" },
  runway: { label: "Runway Closure", icon: Ban, color: "text-red-500" },
  fuel: { label: "Fuel Delay", icon: Fuel, color: "text-emerald-500" },
  security: { label: "Security Incident", icon: Shield, color: "text-rose-500" },
};

function classifyDisruption(reason: string): keyof typeof DISRUPTION_TYPES {
  const r = reason.toLowerCase();
  if (r.includes("weather") || r.includes("storm") || r.includes("wind") || r.includes("fog")) return "weather";
  if (r.includes("mech") || r.includes("tech") || r.includes("maint")) return "technical";
  if (r.includes("crew")) return "crew";
  if (r.includes("congest") || r.includes("gate") || r.includes("slot")) return "congestion";
  if (r.includes("atc") || r.includes("traffic")) return "atc";
  if (r.includes("runway")) return "runway";
  if (r.includes("fuel")) return "fuel";
  if (r.includes("security")) return "security";
  return "weather";
}

function severityOf(minutes: number): "low" | "medium" | "high" | "critical" {
  if (minutes >= 120) return "critical";
  if (minutes >= 60) return "high";
  if (minutes >= 30) return "medium";
  return "low";
}

function riskScore(minutes: number, pax: number, revenue: number) {
  return Math.min(99, Math.round(minutes * 0.4 + pax * 0.08 + revenue / 2500));
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AiDisruption() {
  const { data: delays } = useSuspenseQuery(delaysQuery);
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const { data: notifs } = useSuspenseQuery(notificationsQuery);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(delays[0]?.id ?? null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotifsModal, setShowNotifsModal] = useState(false);
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  const enriched = useMemo(() => {
    return delays.map((d) => {
      const f = flights.find((fl) => fl.flight_no === d.flight_no);
      const type = classifyDisruption(d.reason);
      const sev = severityOf(d.minutes);
      const risk = riskScore(d.minutes, d.affected_passengers, Number(d.revenue_impact));
      return { d, f, type, sev, risk };
    });
  }, [delays, flights]);

  const filtered = useMemo(() => {
    return enriched.filter((x) => {
      const q = search.toLowerCase();
      const matchesQ = !q ||
        x.d.flight_no.toLowerCase().includes(q) ||
        (x.f?.origin ?? "").toLowerCase().includes(q) ||
        (x.f?.destination ?? "").toLowerCase().includes(q) ||
        x.d.reason.toLowerCase().includes(q);
      const matchesSev = severityFilter === "all" || x.sev === severityFilter;
      return matchesQ && matchesSev;
    });
  }, [enriched, search, severityFilter]);

  const selected = enriched.find((x) => x.d.id === selectedId) ?? enriched[0];

  const kpis = useMemo(() => {
    const affectedTotal = delays.reduce((s, d) => s + d.affected_passengers, 0);
    const revenueTotal = delays.reduce((s, d) => s + Number(d.revenue_impact), 0);
    const cancelled = flights.filter((f) => f.status === "cancelled").length;
    const diverted = flights.filter((f) => f.status === "diverted").length;
    const atRisk = enriched.filter((x) => x.risk >= 60).length;
    const highPriority = enriched.filter((x) => x.sev === "critical" || x.sev === "high").length;
    return {
      atRisk, delayed: delays.length, cancelled, diverted, highPriority,
      affectedTotal, revenueTotal,
      recoveryRate: 92.4,
    };
  }, [delays, flights, enriched]);

  const handleExportFullReport = (format: "json" | "csv" | "md") => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    if (format === "json") {
      const report = {
        generated_at: new Date().toISOString(),
        network_kpis: kpis,
        active_disruptions: enriched.map(e => ({
          flight_no: e.d.flight_no,
          route: `${e.f?.origin} -> ${e.f?.destination}`,
          aircraft: e.f?.aircraft_tail,
          reason: e.d.reason,
          delay_minutes: e.d.minutes,
          affected_pax: e.d.affected_passengers,
          revenue_impact: e.d.revenue_impact,
          severity: e.sev,
          ai_risk: e.risk,
        })),
      };
      downloadFile(`SkyWay_AI_Disruption_Report_${timestamp}.json`, JSON.stringify(report, null, 2), "application/json");
    } else if (format === "csv") {
      const headers = "Flight,Route,Aircraft,Type,Severity,Delay_Min,Affected_Pax,Revenue_Impact,AI_Risk\n";
      const rows = enriched.map(e =>
        `${e.d.flight_no},"${e.f?.origin} -> ${e.f?.destination}",${e.f?.aircraft_tail ?? ""},${e.type},${e.sev},${e.d.minutes},${e.d.affected_passengers},${e.d.revenue_impact},${e.risk}`
      ).join("\n");
      downloadFile(`SkyWay_AI_Disruption_Report_${timestamp}.csv`, headers + rows, "text/csv");
    } else {
      const md = `# SkyWay AI Flight Disruption Executive Report\n` +
        `**Generated:** ${new Date().toLocaleString()}\n\n` +
        `## 1. Network Disruption KPIs\n` +
        `- Flights At Risk: ${kpis.atRisk}\n` +
        `- Delayed Flights: ${kpis.delayed}\n` +
        `- Cancelled: ${kpis.cancelled}\n` +
        `- Total Affected Passengers: ${kpis.affectedTotal.toLocaleString()}\n` +
        `- Estimated Operational Cost: $${(kpis.revenueTotal / 1000).toFixed(0)}k\n` +
        `- AI Recovery Success Rate: ${kpis.recoveryRate}%\n\n` +
        `## 2. Active Disruption Incidents\n` +
        enriched.map(e => `### ${e.d.flight_no} (${e.f?.origin} → ${e.f?.destination})\n- **Severity:** ${e.sev.toUpperCase()} | **Risk Score:** ${e.risk}\n- **Reason:** ${e.d.reason}\n- **Delay:** +${e.d.minutes} min | **Pax:** ${e.d.affected_passengers} pax | **Cost:** $${e.d.revenue_impact}\n`).join("\n");
      downloadFile(`SkyWay_AI_Disruption_Report_${timestamp}.md`, md, "text/markdown");
    }
    toast.success(`Disruption report (${format.toUpperCase()}) exported successfully!`);
    setShowExportModal(false);
  };

  const handleSelectFlight = (id: string, flightNo: string) => {
    setSelectedId(id);
    toast.info(`Selected flight ${flightNo}`, {
      description: "AI Decision Panel and predictive telemetry updated.",
    });
    const panel = document.getElementById("ai-decision-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "AI Disruption Manager" }]} />
      <main className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-accent">SkyWay Intelligence</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">AI Flight Disruption Manager</h1>
            <p className="text-sm text-muted-foreground">
              Detect · analyze · predict · recover. Live AI decisioning across the SkyWay network.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              AI Online · 14 signals/sec
            </div>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-sky-accent" /> Export report
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
          <KpiCard label="Flights at risk" value={kpis.atRisk} delta={12.3} icon={AlertTriangle} tone="warning" trend={[3, 5, 4, 6, 7, 9, kpis.atRisk]} />
          <KpiCard label="Delayed flights" value={kpis.delayed} delta={-4.1} icon={Clock} tone="warning" trend={[8, 6, 7, 5, 6, 4, kpis.delayed]} />
          <KpiCard label="Cancellations" value={kpis.cancelled} delta={-8.2} icon={Ban} tone="danger" trend={[2, 3, 2, 1, 2, 1, kpis.cancelled]} />
          <KpiCard label="Diversions" value={kpis.diverted} delta={2.0} icon={MapPin} tone="warning" trend={[0, 1, 1, 0, 2, 1, kpis.diverted]} />
          <KpiCard label="High priority" value={kpis.highPriority} delta={6.5} icon={Zap} tone="danger" trend={[2, 3, 4, 5, 4, 6, kpis.highPriority]} />
          <KpiCard label="Affected passengers" value={kpis.affectedTotal.toLocaleString()} delta={9.1} icon={Users} tone="warning" trend={[200, 340, 410, 520, 610, 700, kpis.affectedTotal]} />
          <KpiCard label="Est. operational cost" value={`$${(kpis.revenueTotal / 1000).toFixed(0)}k`} delta={4.7} icon={DollarSign} tone="danger" trend={[10, 20, 25, 30, 40, 50, kpis.revenueTotal / 1000]} />
          <KpiCard label="AI recovery success" value={`${kpis.recoveryRate}%`} delta={1.8} icon={Sparkles} tone="positive" trend={[88, 89, 90, 91, 91, 92, kpis.recoveryRate]} />
        </section>

        {/* Active disruptions table */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <h2 className="font-display text-lg">Active disruptions</h2>
              <p className="text-xs text-muted-foreground">Live feed · updated every 10s</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search flight, route, reason…"
                  className="h-8 w-56 rounded-md border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-sky-accent"
                />
              </div>
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                <Filter className="ml-1.5 h-3 w-3 text-muted-foreground" />
                {(["all", "low", "medium", "high", "critical"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`rounded px-2 py-0.5 text-[11px] capitalize ${severityFilter === s ? "bg-sky-accent/15 text-sky-accent font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left">Flight</th>
                  <th className="px-4 py-2 text-left">Route</th>
                  <th className="px-4 py-2 text-left">Aircraft</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Severity</th>
                  <th className="px-4 py-2 text-right">Delay</th>
                  <th className="px-4 py-2 text-right">Pax</th>
                  <th className="px-4 py-2 text-right">AI Risk</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ d, f, type, sev, risk }) => {
                  const T = DISRUPTION_TYPES[type];
                  const active = selectedId === d.id;
                  const isDispatched = dispatchedIds.includes(d.id);
                  const isRejected = rejectedIds.includes(d.id);
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-border last:border-none transition-colors hover:bg-muted/40 cursor-pointer ${active ? "bg-sky-accent/5" : ""}`}
                      onClick={() => handleSelectFlight(d.id, d.flight_no)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold">
                        <div className="flex items-center gap-1.5">
                          {d.flight_no}
                          {isDispatched && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {isRejected && <X className="h-3.5 w-3.5 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{f?.origin ?? "—"} → {f?.destination ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{f?.aircraft_tail ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 ${T.color}`}>
                          <T.icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{T.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={sev} /></td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-amber-500">+{d.minutes}m</td>
                      <td className="px-4 py-3 text-right font-mono">{d.affected_passengers}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${risk >= 75 ? "bg-red-500" : risk >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${risk}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold">{risk}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFlight(d.id, d.flight_no);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted text-foreground"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">No disruptions match your filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Decision Panel + Detection */}
        {selected && (
          <section id="ai-decision-panel" className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <AiDecisionPanel
              selected={selected}
              isDispatched={dispatchedIds.includes(selected.d.id)}
              isRejected={rejectedIds.includes(selected.d.id)}
              onApprove={() => {
                setDispatchedIds(prev => [...prev, selected.d.id]);
                setRejectedIds(prev => prev.filter(id => id !== selected.d.id));
                toast.success(`AI Recovery Plan dispatched for ${selected.d.flight_no}!`, {
                  description: "Tail swap SW-A003 assigned. ATC slot and EU261 passenger flow triggered.",
                });
              }}
              onReject={() => {
                setRejectedIds(prev => [...prev, selected.d.id]);
                setDispatchedIds(prev => prev.filter(id => id !== selected.d.id));
                toast.error(`Recovery plan for ${selected.d.flight_no} rejected.`, {
                  description: "OCC manual controller intervention flagged.",
                });
              }}
            />
            <div className="space-y-6">
              <DetectionCard selected={selected} />
              <RootCauseCard selected={selected} />
            </div>
          </section>
        )}

        {/* Prediction + Recovery */}
        {selected && (
          <section className="grid gap-6 lg:grid-cols-2">
            <PredictionEngineCard selected={selected} />
            <RecoveryRecommendations selected={selected} />
          </section>
        )}

        {/* Passenger + Financial impact */}
        <section className="grid gap-6 lg:grid-cols-2">
          <PassengerImpactCard totalAffected={kpis.affectedTotal} />
          <FinancialImpactCard revenueTotal={kpis.revenueTotal} />
        </section>

        {/* Timeline */}
        <TimelineCard selected={selected} />

        {/* Notifications + Chat */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <NotificationsCard notifs={notifs} onOpenAll={() => setShowNotifsModal(true)} />
          <AiChatCard />
        </section>

        {/* Reports */}
        <ReportsCard onOpenCenter={() => setShowExportModal(true)} />
      </main>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-accent">
              <Download className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">OCC Report Export</span>
            </div>
            <h2 className="mt-1 font-display text-2xl">Export Disruption Analysis</h2>
            <p className="text-xs text-muted-foreground">
              Generate formatted operational briefings for flight operations, crew scheduling, and executives.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => handleExportFullReport("md")}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-4 text-left hover:border-sky-accent hover:bg-sky-accent/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-accent/15 text-sky-accent">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Executive Markdown Brief (.md)</div>
                    <div className="text-xs text-muted-foreground">Comprehensive overview with KPIs and recovery steps</div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleExportFullReport("csv")}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-4 text-left hover:border-sky-accent hover:bg-sky-accent/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Operational CSV Spreadsheet (.csv)</div>
                    <div className="text-xs text-muted-foreground">Flight-level telemetry, delays, and revenue impact</div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleExportFullReport("json")}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-4 text-left hover:border-sky-accent hover:bg-sky-accent/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Raw AI Telemetry JSON (.json)</div>
                    <div className="text-xs text-muted-foreground">Machine-readable data for dispatch systems & APIs</div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowNotifsModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-accent">
              <Radio className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">OCC Alert Broadcast Center</span>
            </div>
            <h2 className="mt-1 font-display text-2xl">All AI Operational Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {notifs.length} active system alerts and operational broadcasts.
            </p>

            <ul className="mt-4 space-y-2.5">
              {notifs.map((n) => (
                <li key={n.id} className="rounded-xl border border-border bg-background p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        n.severity === "critical" ? "bg-red-500" :
                        n.severity === "high" ? "bg-orange-500" :
                        n.severity === "medium" ? "bg-amber-400" : "bg-sky-400"
                      }`} />
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">{n.type}</span>
                      {n.flight_no && <span className="font-mono font-bold text-foreground">{n.flight_no}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="mt-1 font-semibold text-foreground">{n.title}</div>
                  {n.body && <p className="mt-1 text-muted-foreground">{n.body}</p>}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  toast.success("All operational alerts acknowledged.");
                  setShowNotifsModal(false);
                }}
                className="rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Acknowledge All Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ----------------- Sub-components ----------------- */

type Selected = {
  d: { id: string; flight_no: string; reason: string; minutes: number; affected_passengers: number; revenue_impact: number | string; recovery_status: string | null };
  f: { origin: string; destination: string; aircraft_tail: string | null; gate: string | null; captain: string | null } | undefined;
  type: keyof typeof DISRUPTION_TYPES;
  sev: "low" | "medium" | "high" | "critical";
  risk: number;
};

function AiDecisionPanel({
  selected,
  isDispatched,
  isRejected,
  onApprove,
  onReject,
}: {
  selected: Selected;
  isDispatched: boolean;
  isRejected: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { d, f } = selected;
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [adjustedDelay, setAdjustedDelay] = useState(d.minutes);
  const [adjustedTail, setAdjustedTail] = useState("SW-A003");
  const [holdTime, setHoldTime] = useState(25);

  const handleSaveModification = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModifyModal(false);
    toast.success(`Modified recovery parameters saved for ${d.flight_no}`, {
      description: `Tail: ${adjustedTail} | Adjusted Delay: ${adjustedDelay}m | Hold: ${holdTime}m`,
    });
  };

  return (
    <div className="rounded-2xl border border-sky-accent/40 bg-gradient-to-br from-sky-dark to-[#132a5c] p-6 text-white shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-gold">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Decision Panel</span>
        </div>
        <div className="flex items-center gap-2">
          {isDispatched && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              <Check className="h-3 w-3" /> Dispatched
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300">
              <X className="h-3 w-3" /> Rejected
            </span>
          )}
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/80">Highest priority</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-display text-4xl">{d.flight_no}</div>
        <div className="text-sm text-white/70">{f?.origin} → {f?.destination}</div>
      </div>

      <p className="mt-3 text-sm text-white/80">
        {d.reason}. Predicted delay {d.minutes}m ± 15m, affecting {d.affected_passengers} passengers
        and ${Number(d.revenue_impact).toLocaleString()} in revenue.
      </p>

      <div className="mt-5 grid grid-cols-4 gap-3">
        <Pill icon={Clock} label="Delay" value={`${d.minutes}m`} />
        <Pill icon={Users} label="Pax" value={String(d.affected_passengers)} />
        <Pill icon={DollarSign} label="Revenue" value={`$${(Number(d.revenue_impact) / 1000).toFixed(0)}k`} />
        <Pill icon={Plane} label="Aircraft" value={f?.aircraft_tail ?? "—"} />
      </div>

      <div className="mt-5 space-y-3">
        <FlowStep n={1} title="Problem summary" body={`${d.reason} on ${d.flight_no}.`} />
        <FlowStep n={2} title="Root cause" body="Convective activity over destination sector holding arrivals." />
        <FlowStep n={3} title="Predictions" body={`Delay ${d.minutes}m · missed connections ~${Math.round(d.affected_passengers * 0.14)} · cancel prob 12%.`} />
        <FlowStep n={4} title="Recovery recommendations" body="Tail swap SW-A003, hold Paris departure 25m, trigger EU261 flow." />
        <FlowStep n={5} title="Estimated outcome" body="Recovery in 47m · $18k saved · CSAT −2 pts." />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
        <div className="flex items-center gap-3 text-xs text-white/70">
          <div>Confidence · <span className="font-mono font-semibold text-sky-gold">94%</span></div>
          <span className="text-white/30">·</span>
          <div>Model · <span className="font-mono">SkyWay-OPS v3.2</span></div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReject}
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setShowModifyModal(true)}
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            Modify
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-gold px-3.5 py-1.5 text-xs font-semibold text-sky-dark hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve & dispatch
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm text-foreground">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowModifyModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-xl">Modify Recovery Directives</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Customize AI parameters for {d.flight_no}</p>

            <form onSubmit={handleSaveModification} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold">Aircraft Tail Swap Assignment</label>
                <input
                  value={adjustedTail}
                  onChange={(e) => setAdjustedTail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-semibold">Target Ground Hold (Minutes)</label>
                <input
                  type="number"
                  value={holdTime}
                  onChange={(e) => setHoldTime(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-semibold">Adjusted Scheduled Delay Buffer (Minutes)</label>
                <input
                  type="number"
                  value={adjustedDelay}
                  onChange={(e) => setAdjustedDelay(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowModifyModal(false)}
                  className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-dark px-4 py-2 font-semibold text-white hover:opacity-90"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetectionCard({ selected }: { selected: Selected }) {
  const T = DISRUPTION_TYPES[selected.type];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-sky-accent" />
        <h3 className="font-display text-lg">AI disruption detection</h3>
      </div>
      <div className="mt-4 space-y-3">
        <DetectRow label="Problem" value={selected.d.reason} />
        <DetectRow label="Confidence" value={<span className="font-mono font-semibold text-emerald-500">94%</span>} />
        <DetectRow label="Category" value={<span className={`inline-flex items-center gap-1.5 ${T.color}`}><T.icon className="h-3.5 w-3.5" />{T.label}</span>} />
        <DetectRow label="Supporting data" value="METAR HKG · storm cell radar · FAA notice #4421" />
        <DetectRow label="Suggested action" value="Tail swap + rebook · notify VIP tier" />
      </div>
    </div>
  );
}

function DetectRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-none last:pb-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

function RootCauseCard({ selected }: { selected: Selected }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-sky-accent" />
        <h3 className="font-display text-lg">Root cause analysis</h3>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Kv k="Primary" v="Convective weather" />
        <Kv k="Secondary" v="Downstream slot loss" />
        <Kv k="Severity" v={selected.sev.toUpperCase()} tone="warn" />
        <Kv k="Expected duration" v={`${selected.d.minutes}m`} />
        <Kv k="Business impact" v={`$${(Number(selected.d.revenue_impact) / 1000).toFixed(0)}k`} />
        <Kv k="Passenger impact" v={`${selected.d.affected_passengers} pax`} />
        <Kv k="Operational" v="2 crew rotations at risk" />
        <Kv k="Financial" v="EU261 exposure $12k" />
      </dl>
    </div>
  );
}

function Kv({ k, v, tone }: { k: string; v: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className={`mt-0.5 font-mono text-sm font-semibold ${tone === "warn" ? "text-amber-500" : ""}`}>{v}</div>
    </div>
  );
}

function PredictionEngineCard({ selected }: { selected: Selected }) {
  const predictions = [
    { label: "Estimated delay", value: `${selected.d.minutes}m`, conf: 94, risk: "high" },
    { label: "Cancellation probability", value: "12%", conf: 88, risk: "medium" },
    { label: "Diversion probability", value: "6%", conf: 82, risk: "low" },
    { label: "Missed connections", value: String(Math.round(selected.d.affected_passengers * 0.14)), conf: 91, risk: "high" },
    { label: "Crew impact", value: "2 rotations", conf: 79, risk: "medium" },
    { label: "Gate availability", value: "Tight", conf: 74, risk: "medium" },
    { label: "Aircraft availability", value: "Backup ready", conf: 96, risk: "low" },
    { label: "Revenue loss", value: `$${(Number(selected.d.revenue_impact) / 1000).toFixed(0)}k`, conf: 90, risk: "high" },
    { label: "CSAT impact", value: "−2 pts", conf: 71, risk: "medium" },
    { label: "Recovery time", value: "47m", conf: 86, risk: "medium" },
  ];
  const riskColor = (r: string) => r === "high" ? "text-red-500" : r === "medium" ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-sky-accent" />
        <h3 className="font-display text-lg">AI prediction engine</h3>
      </div>
      <div className="mt-4 grid gap-2">
        {predictions.map((p) => (
          <div key={p.label} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{p.label}</div>
              <div className="mt-0.5 font-mono font-semibold">{p.value}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Confidence</div>
                <div className="font-mono text-xs font-semibold">{p.conf}%</div>
              </div>
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${riskColor(p.risk)}`}>{p.risk}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryRecommendations({ selected }: { selected: Selected }) {
  const [applied, setApplied] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);

  const recs = [
    { id: "swap", title: "Tail swap → SW-A003", why: "Nearest available aircraft at hub, same type rating.", impact: "−32m delay", cost: "$4.2k", conf: 96 },
    { id: "rebook", title: "Passenger rebooking", why: `${Math.round(selected.d.affected_passengers * 0.6)} pax onto next-day partner service.`, impact: "CSAT +3", cost: "$18k", conf: 92 },
    { id: "gate", title: "Alternate gate B12", why: "Frees congested A-pier for on-time departures.", impact: "−8m taxi", cost: "$0", conf: 89 },
    { id: "crew", title: "Crew rotation adj.", why: "Reserve captain on standby, within duty limits.", impact: "0 crew violations", cost: "$1.1k", conf: 94 },
    { id: "vouchers", title: "Meal vouchers & hotel", why: `Overnight coverage for ${Math.round(selected.d.affected_passengers * 0.15)} pax.`, impact: "Comply EU261", cost: "$9.8k", conf: 99 },
    { id: "fuel", title: "Fuel optimization", why: "Reroute via NRT airway saves 320kg.", impact: "$820 saved", cost: "$0", conf: 87 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-gold" />
          <h3 className="font-display text-lg">AI recovery recommendations</h3>
        </div>
        <span className="text-xs text-muted-foreground">{applied.length} applied</span>
      </div>
      <ol className="mt-4 space-y-3">
        {recs.map((r, i) => {
          const isApplied = applied.includes(r.id);
          const isSkipped = skipped.includes(r.id);
          return (
            <li key={r.id} className={`rounded-lg border p-4 transition-all ${
              isApplied ? "border-emerald-500/50 bg-emerald-500/5" :
              isSkipped ? "border-border/40 opacity-40" : "border-border"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isApplied ? "bg-emerald-500 text-white" : "bg-sky-accent/15 text-sky-accent"
                  }`}>
                    {isApplied ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {r.title}
                      {isApplied && <span className="text-[10px] font-bold text-emerald-500 uppercase">Applied</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.why}</p>
                  </div>
                </div>
                <div className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-600">{r.conf}%</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px]">
                <div className="flex gap-4 text-muted-foreground">
                  <span>Improvement · <span className="font-semibold text-foreground">{r.impact}</span></span>
                  <span>Cost · <span className="font-semibold text-foreground">{r.cost}</span></span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSkipped(prev => [...prev, r.id]);
                      setApplied(prev => prev.filter(x => x !== r.id));
                      toast.info(`Skipped recommendation: ${r.title}`);
                    }}
                    className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApplied(prev => [...prev, r.id]);
                      setSkipped(prev => prev.filter(x => x !== r.id));
                      toast.success(`Applied AI Recommendation: ${r.title}`, {
                        description: `Operational directive updated (${r.impact}).`,
                      });
                    }}
                    className="rounded-md bg-sky-dark px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                  >
                    {isApplied ? "Re-apply" : "Apply"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PassengerImpactCard({ totalAffected }: { totalAffected: number }) {
  const data = [
    { name: "Economy", value: Math.round(totalAffected * 0.72) },
    { name: "Business", value: Math.round(totalAffected * 0.19) },
    { name: "First", value: Math.round(totalAffected * 0.06) },
    { name: "VIP", value: Math.round(totalAffected * 0.03) },
  ];
  const colors = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-sky-accent" />
        <h3 className="font-display text-lg">Passenger impact</h3>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-6">
        <div className="h-48">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid content-center gap-2 text-xs">
          <ImpactRow icon={Users} label="Connecting" value={Math.round(totalAffected * 0.24)} />
          <ImpactRow icon={Star} label="VIP / status" value={Math.round(totalAffected * 0.06)} />
          <ImpactRow icon={HeartHandshake} label="Special assist" value={Math.round(totalAffected * 0.03)} />
          <ImpactRow icon={Plane} label="International" value={Math.round(totalAffected * 0.31)} />
          <ImpactRow icon={RefreshCcw} label="Rebooking req." value={Math.round(totalAffected * 0.42)} />
          <ImpactRow icon={DollarSign} label="Est. compensation" value={`$${(totalAffected * 180).toLocaleString()}`} />
        </ul>
      </div>
    </div>
  );
}

function ImpactRow({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <li className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-none">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </li>
  );
}

function FinancialImpactCard({ revenueTotal }: { revenueTotal: number }) {
  const rows = [
    { k: "Revenue loss", v: revenueTotal, tone: "danger" },
    { k: "Compensation", v: revenueTotal * 0.28, tone: "danger" },
    { k: "Hotel cost", v: revenueTotal * 0.09, tone: "warn" },
    { k: "Meal vouchers", v: revenueTotal * 0.04, tone: "warn" },
    { k: "Fuel", v: revenueTotal * 0.12, tone: "warn" },
    { k: "Operational", v: revenueTotal * 0.18, tone: "warn" },
    { k: "Recovery cost", v: revenueTotal * 0.06, tone: "warn" },
    { k: "AI expected savings", v: revenueTotal * 0.34, tone: "positive" },
  ];
  const chartData = rows.slice(0, 7).map((r) => ({ name: r.k, value: Math.round(r.v / 1000) }));
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-sky-accent" />
        <h3 className="font-display text-lg">Financial impact</h3>
      </div>
      <div className="mt-4 h-40">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => `$${v}k`} />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
            <span className="text-muted-foreground">{r.k}</span>
            <span className={`font-mono font-semibold ${r.tone === "danger" ? "text-red-500" : r.tone === "positive" ? "text-emerald-500" : "text-amber-500"}`}>
              {r.tone === "positive" ? "+" : "-"}${(r.v / 1000).toFixed(1)}k
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimelineCard({ selected }: { selected: Selected | undefined }) {
  const steps = [
    { label: "Flight scheduled", time: "06:00", state: "done", icon: Plane },
    { label: "Delay detected", time: "07:14", state: "done", icon: AlertTriangle },
    { label: "AI analysis", time: "07:14", state: "done", icon: Sparkles },
    { label: "Operations review", time: "07:22", state: "active", icon: UserCheck },
    { label: "Recovery approved", time: "—", state: "pending", icon: CheckCircle2 },
    { label: "Passengers notified", time: "—", state: "pending", icon: Send },
    { label: "Flight resumed", time: "—", state: "pending", icon: Plane },
  ];
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-sky-accent" />
          <h3 className="font-display text-lg">Disruption timeline</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{selected?.d.flight_no ?? ""}</span>
      </div>
      <ol className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-7">
        {steps.map((s, i) => {
          const done = s.state === "done";
          const active = s.state === "active";
          return (
            <li key={s.label} className="relative flex flex-col items-center text-center">
              {i < steps.length - 1 && (
                <div className={`absolute left-1/2 top-4 hidden h-0.5 w-full md:block ${done ? "bg-emerald-500" : "bg-border"}`} />
              )}
              <div className={`relative grid h-8 w-8 place-items-center rounded-full border-2 ${
                done ? "border-emerald-500 bg-emerald-500 text-white" :
                active ? "border-sky-accent bg-sky-accent/15 text-sky-accent animate-pulse" :
                "border-border bg-card text-muted-foreground"
              }`}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
              <div className={`mt-2 text-[11px] font-semibold ${active ? "text-sky-accent" : done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{s.time}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function NotificationsCard({
  notifs,
  onOpenAll,
}: {
  notifs: Array<{ id: string; type: string; severity: string; title: string; body: string | null; created_at: string; flight_no: string | null }>;
  onOpenAll: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-sky-accent" />
          <h3 className="font-display text-lg">AI notifications</h3>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-xs text-sky-accent hover:underline"
        >
          View all →
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {notifs.slice(0, 6).map((n) => (
          <li key={n.id} className="flex gap-3 rounded-lg border border-border p-3 text-xs">
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              n.severity === "critical" ? "bg-red-500" :
              n.severity === "high" ? "bg-orange-500" :
              n.severity === "medium" ? "bg-amber-400" : "bg-sky-400"
            }`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{n.type}</span>
                {n.flight_no && <span className="font-mono text-[11px] font-semibold">{n.flight_no}</span>}
              </div>
              <div className="mt-0.5 font-semibold text-foreground">{n.title}</div>
              {n.body && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{n.body}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiChatCard() {
  const [msgs, setMsgs] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "I'm SkyWay Copilot. Ask me about disruptions, recovery, passenger impact or generate a report." },
  ]);
  const [input, setInput] = useState("");
  const prompts = [
    "Why is SK102 delayed?",
    "Recommend recovery for the highest risk flight",
    "Show critical flights",
    "Estimate passenger impact today",
    "Which airport has the highest disruption risk?",
    "Generate disruption report",
  ];

  function send(text: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }, { role: "ai", text: mockReply(text) }]);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-sky-accent" />
        <h3 className="font-display text-lg">AI copilot</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {prompts.map((p) => (
          <button key={p} onClick={() => send(p)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-sky-accent hover:text-sky-accent transition-colors">
            {p}
          </button>
        ))}
      </div>
      <div className="mt-4 max-h-72 flex-1 space-y-2 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-sky-accent text-white" : "bg-muted text-foreground"}`}>{m.text}</div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask copilot…" className="flex-1 bg-transparent text-sm focus:outline-none" />
        <button type="submit" className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-dark text-white hover:opacity-90"><Send className="h-3.5 w-3.5" /></button>
      </form>
    </div>
  );
}

function mockReply(q: string) {
  const s = q.toLowerCase();
  if (s.includes("delayed") || s.includes("sk102")) return "SK102 is delayed 68m due to convective weather at destination. AI recommends tail swap SW-A003 and holding Paris departure 25m. Confidence 94%.";
  if (s.includes("recovery")) return "Highest risk is SK415. Recommended plan: reroute via NRT, rebook 42 pax on partner service, issue EU261 vouchers. Est. recovery 47m.";
  if (s.includes("critical")) return "3 flights currently critical: SK102, SK415, SK209. All have AI plans staged for approval.";
  if (s.includes("passenger")) return "Est. 1,240 passengers impacted today · 174 missed connections · 78 VIPs · $223k in compensation exposure.";
  if (s.includes("airport")) return "HKG has the highest disruption risk today (score 78) driven by storm cells and 92% gate congestion.";
  if (s.includes("report")) return "Generating disruption report for the last 24h — 12 incidents, $184k impact, 92% AI recovery success. Opening download panel.";
  return "I'll take a look. Meanwhile: 12 active disruptions, 3 critical, AI recovery success 92.4% today.";
}

function ReportsCard({ onOpenCenter }: { onOpenCenter: () => void }) {
  const reports = [
    { name: "Incident summary", icon: FileText, meta: "12 incidents · 24h", type: "incident-summary" },
    { name: "Timeline export", icon: Timer, meta: "All flights · today", type: "timeline" },
    { name: "Passengers affected", icon: Users, meta: "1,240 pax · CSV", type: "passengers" },
    { name: "Financial impact", icon: DollarSign, meta: "$184k · PDF", type: "financial" },
    { name: "Recovery actions", icon: CheckCircle2, meta: "38 actions · PDF", type: "recovery" },
    { name: "AI recommendations", icon: Sparkles, meta: "62 recs · PDF", type: "recommendations" },
    { name: "Final resolution", icon: TrendingUp, meta: "Weekly", type: "resolution" },
    { name: "Lessons learned", icon: TrendingDown, meta: "Monthly", type: "lessons" },
  ];

  const handleDownloadSingleReport = (name: string, type: string) => {
    const ts = new Date().toLocaleDateString();
    let content = `# SkyWay Report: ${name}\nGenerated: ${ts}\n\n`;
    if (type === "passengers") {
      content += `Passenger Name,PNR,Flight,Class,Status,Compensation\n` +
        `John Davis,SKY112,SW732,Business,Delayed,+45m Meal Voucher\n` +
        `Alice Wong,SKY903,SW220,Economy,Rebooked,SW204 Confirmed\n` +
        `Raj Patel,SKY441,SW1225,First,VIP Priority,Lounge & Transfer`;
      downloadFile(`SkyWay_${name.replace(/\s+/g, "_")}.csv`, content, "text/csv");
    } else {
      content += `## Overview\nExecutive log for ${name}.\n- Status: Completed\n- Validated by OCC Controller: Confirmed\n- Model Engine: SkyWay-OPS v3.2\n`;
      downloadFile(`SkyWay_${name.replace(/\s+/g, "_")}.md`, content, "text/markdown");
    }
    toast.success(`Generated and downloaded ${name}!`);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-sky-accent" />
          <h3 className="font-display text-lg">Reports</h3>
        </div>
        <button
          type="button"
          onClick={onOpenCenter}
          className="text-xs text-sky-accent hover:underline"
        >
          Report center →
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((r) => (
          <button
            key={r.name}
            type="button"
            onClick={() => handleDownloadSingleReport(r.name, r.type)}
            className="group flex items-center justify-between rounded-lg border border-border p-3 text-left hover:border-sky-accent hover:bg-sky-accent/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-muted text-sky-accent group-hover:bg-sky-accent group-hover:text-white transition-colors">
                <r.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.meta}</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------ Little primitives ------------ */

function Pill({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/60"><Icon className="h-3 w-3" />{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function FlowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-gold/20 text-xs font-bold text-sky-gold">{n}</div>
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-sky-gold">{title}</div>
        <div className="text-sm text-white/90">{body}</div>
      </div>
      <ArrowRight className="mt-1 h-3.5 w-3.5 text-white/40" />
    </div>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Plane, Wrench, Building2, UserCog, DollarSign, LifeBuoy, Sparkles, Download, Bell, Plus, Check, X, FileText, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { users, flights, fleet, airports, employees, notifications as initialNotifications, type Notification } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

const spark = (base: number, seed = 0) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin((i + seed) * 0.7) * base * 0.15 + (i - 6) * 0.6));

function AdminDashboard() {
  const [alerts, setAlerts] = useState<Notification[]>(initialNotifications);
  const [isNewAnnounceOpen, setIsNewAnnounceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // New Announcement Form State
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceAudience, setAnnounceAudience] = useState<"All" | "Passengers" | "Staff" | "Ops">("All");
  const [announceType, setAnnounceType] = useState<"Advisory" | "System" | "Flight" | "Promotion" | "Internal">("Advisory");
  const [announcePriority, setAnnouncePriority] = useState<"normal" | "urgent">("normal");

  // Export State
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "json">("csv");
  const [exportTimeframe, setExportTimeframe] = useState<"24h" | "7d" | "30d" | "ytd">("30d");
  const [exporting, setExporting] = useState(false);

  const activeFlights = flights.filter((f) => f.status !== "completed" && f.status !== "cancelled").length;
  const revenue = 1_248_320;

  const revTrend = Array.from({ length: 12 }, (_, i) => ({
    m: ["J","F","M","A","M","J","J","A","S","O","N","D"][i],
    rev: 800 + Math.round(Math.sin(i / 2) * 220 + i * 40 + Math.random() * 90),
  }));
  const paxSplit = [
    { name: "Economy",  value: 62, fill: "hsl(220 30% 60%)" },
    { name: "Premium",  value: 22, fill: "hsl(220 80% 55%)" },
    { name: "Business", value: 12, fill: "hsl(42 75% 55%)" },
    { name: "First",    value: 4,  fill: "hsl(268 60% 60%)" },
  ];
  const bookings = Array.from({ length: 14 }, (_, i) => ({
    d: `${i + 1}`, bookings: 4200 + Math.round(Math.sin(i / 2) * 800 + i * 60),
  }));

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceBody.trim()) {
      toast.error("Please fill in both title and description.");
      return;
    }

    const newAlert: Notification = {
      id: `notif_${Date.now()}`,
      title: announceTitle.trim(),
      body: `[${announceAudience.toUpperCase()}] ${announceBody.trim()}`,
      at: new Date().toISOString(),
      kind: announceType === "Advisory" || announceType === "Internal" ? "warning" : "info",
      read: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setIsNewAnnounceOpen(false);
    setAnnounceTitle("");
    setAnnounceBody("");
    toast.success(`Announcement broadcasted to ${announceAudience}!`, {
      description: `Type: ${announceType} · Priority: ${announcePriority}`,
    });
  };

  const handleDownloadReport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setIsExportOpen(false);

      if (exportFormat === "csv") {
        const csvContent = "data:text/csv;charset=utf-8," +
          "Metric,Value,Timeframe,Status\n" +
          `Total Passengers,2.41M,${exportTimeframe},Optimal\n` +
          `Active Flights,${activeFlights},${exportTimeframe},Operational\n` +
          `Fleet Size,${fleet.length},${exportTimeframe},Ready\n` +
          `Airports Served,${airports.length},${exportTimeframe},Active\n` +
          `Daily Revenue,$1.24M,${exportTimeframe},Profitable\n` +
          `AI System Health,99.4%,${exportTimeframe},Healthy\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SkyWay_Executive_Report_${exportTimeframe}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (exportFormat === "json") {
        const jsonString = `data:text/json;charset=utf-8,` + encodeURIComponent(JSON.stringify({
          generatedAt: new Date().toISOString(),
          timeframe: exportTimeframe,
          metrics: {
            passengers: "2.41M",
            activeFlights,
            fleetCount: fleet.length,
            airportsCount: airports.length,
            dailyRevenue: revenue,
            aiHealth: "99.4%",
          },
          fleet,
          flights,
        }, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", jsonString);
        link.setAttribute("download", `SkyWay_Executive_Report_${exportTimeframe}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`Executive ${exportFormat.toUpperCase()} report exported successfully!`, {
        description: `Covering ${exportTimeframe.toUpperCase()} operational period.`,
      });
    }, 600);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Dashboard" }]}
        action={{
          label: "Quick Announcement",
          onClick: () => setIsNewAnnounceOpen(true),
        }}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-accent">Administrator</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">Platform overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Command center for SkyWay Airlines · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5" /> Export report
            </button>
            <button
              onClick={() => setIsNewAnnounceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> New announcement
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Total Passengers"  value="2.41M"      delta={5.2}  icon={Users}      trend={spark(24, 1)} tone="positive" />
          <KpiCard label="Active Flights"    value={activeFlights} delta={2.7}  icon={Plane}      trend={spark(activeFlights, 2)} />
          <KpiCard label="Aircraft Fleet"    value={fleet.length} delta={0}    icon={Wrench}     trend={spark(9, 3)} />
          <KpiCard label="Airports Served"   value={airports.length} delta={1.4} icon={Building2} trend={spark(8, 4)} />
          <KpiCard label="Employees"         value="12,480"     delta={0.8}  icon={UserCog}    trend={spark(24, 5)} />
          <KpiCard label="Daily Revenue"     value={`$${(revenue / 1000).toFixed(0)}K`} delta={3.6} icon={DollarSign} trend={spark(20, 6)} tone="positive" />
          <KpiCard label="Support Tickets"   value="184"        delta={-4.1} icon={LifeBuoy}   trend={spark(20, 7)} tone="warning" />
          <KpiCard label="AI System Health"  value="99.4%"      delta={0.2}  icon={Sparkles}   trend={spark(30, 8)} tone="positive" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg">Revenue · 12 months</h3>
                <p className="text-xs text-muted-foreground">Gross ticket revenue in millions USD</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">+18.4% YoY</span>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <AreaChart data={revTrend}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3DA5F5" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3DA5F5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area dataKey="rev" stroke="#3DA5F5" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Passenger mix</h3>
            <p className="text-xs text-muted-foreground">Cabin distribution — trailing 30 days</p>
            <div className="mt-2 h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paxSplit} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {paxSplit.map((c, i) => <Cell key={i} fill={c.fill} />)}
                  </Pie>
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Booking volume · 14 days</h3>
              <span className="text-[11px] text-muted-foreground">Daily paid bookings</span>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <BarChart data={bookings}>
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="bookings" fill="#0A1F44" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Live system alerts</h3>
              <button
                onClick={() => setIsNewAnnounceOpen(true)}
                className="text-[11px] font-semibold text-sky-accent hover:underline"
              >
                + Broadcast
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {alerts.slice(0, 5).map((n) => (
                <li key={n.id} className="flex gap-3 border-l-2 border-sky-accent/60 pl-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">{n.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(n.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {n.kind}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Recently registered users</h3>
            <span className="text-[11px] text-muted-foreground">{users.length} total</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Email</th><th className="pb-2 pr-4">Role</th><th className="pb-2">Created</th></tr>
              </thead>
              <tbody>
                {users.slice(0, 6).map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="py-2.5 pr-4 font-medium">{u.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-2.5 pr-4 capitalize">{u.role}</td>
                    <td className="py-2.5 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">Employees pool: {employees.length} on shift — go to Employees for details.</p>
      </main>

      {/* New Announcement Modal */}
      {isNewAnnounceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Publish Airline Announcement</h2>
                  <p className="text-xs text-muted-foreground">Broadcast network alerts, advisories, and notices</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewAnnounceOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Announcement Title *</label>
                <input
                  required
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="e.g. Severe Winter Weather Delay Protocol at JFK"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Target Audience</label>
                  <select
                    value={announceAudience}
                    onChange={(e) => setAnnounceAudience(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="All">All Users (Global)</option>
                    <option value="Passengers">Passengers Only</option>
                    <option value="Staff">Airline Staff</option>
                    <option value="Ops">Operations & Crew</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Announcement Type</label>
                  <select
                    value={announceType}
                    onChange={(e) => setAnnounceType(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Advisory">Weather & Travel Advisory</option>
                    <option value="Flight">Flight Operation Notice</option>
                    <option value="Promotion">Promotional / Bonus Miles</option>
                    <option value="System">System Maintenance</option>
                    <option value="Internal">Internal Operational Directive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Priority Level</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={announcePriority === "normal"}
                      onChange={() => setAnnouncePriority("normal")}
                    />
                    <span>Standard Broadcast</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-amber-600 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={announcePriority === "urgent"}
                      onChange={() => setAnnouncePriority("urgent")}
                    />
                    <span>High Priority Flash Alert</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Announcement Content *</label>
                <textarea
                  required
                  rows={4}
                  value={announceBody}
                  onChange={(e) => setAnnounceBody(e.target.value)}
                  placeholder="Detailed message or instructions to be displayed across passenger and ops portals..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewAnnounceOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Broadcast Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-white">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Export Executive Report</h2>
                  <p className="text-xs text-muted-foreground">Download comprehensive performance datasets</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "csv", label: "CSV Dataset", icon: FileText },
                    { id: "pdf", label: "PDF Summary", icon: FileText },
                    { id: "json", label: "JSON Raw", icon: FileText },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setExportFormat(fmt.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition ${
                        exportFormat === fmt.id
                          ? "border-sky-accent bg-sky-500/10 text-sky-600 font-semibold"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <fmt.icon className="h-4 w-4 mb-1" />
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Reporting Timeframe</label>
                <select
                  value={exportTimeframe}
                  onChange={(e) => setExportTimeframe(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="24h">Last 24 Hours (Realtime OCC & Revenue)</option>
                  <option value="7d">Last 7 Days (Weekly Rolling Trends)</option>
                  <option value="30d">Last 30 Days (Monthly Financials & Fleet)</option>
                  <option value="ytd">Year to Date (Fiscal 2026 Audit)</option>
                </select>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Report Payload Includes:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  <li>Fleet Utilization & Fuel Telemetry</li>
                  <li>Live Flight Status & Delay Variance</li>
                  <li>Revenue Breakdown & Load Factors</li>
                  <li>Passenger Registrations & Loyalty Tiers</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm disabled:opacity-50"
                >
                  <Download className="h-4 w-4" /> {exporting ? "Generating..." : `Download ${exportFormat.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

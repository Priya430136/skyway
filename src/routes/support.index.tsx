import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, Clock, CheckCircle2, Timer, Smile, Wallet, AlertTriangle, Sparkles } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { tickets, ticketVolume, csatTrend, categoryMix, supportNotifications, refunds } from "@/lib/support/mock";

export const Route = createFileRoute("/support/")({ component: SupportDashboard });

const spark = (base: number, seed = 0) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin((i + seed) * 0.7) * base * 0.15 + (i - 6) * 0.6));

function SupportDashboard() {
  const open = tickets.filter((t) => t.status === "open").length;
  const pending = tickets.filter((t) => t.status === "pending").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const escalated = tickets.filter((t) => t.status === "escalated").length;
  const pendingRefunds = refunds.filter((r) => r.status === "pending").length;

  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "Dashboard" }]} action={{ label: "New ticket" }} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-accent">Customer Support</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">Support workload overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live queues, SLA health, and AI insights · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">Export report</button>
            <Link to="/support/tickets" className="rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90">Open queue</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Open Tickets"      value={open}       delta={4.2}  icon={Ticket}       trend={spark(open, 1)} tone="warning" />
          <KpiCard label="Pending Tickets"   value={pending}    delta={-2.1} icon={Clock}        trend={spark(pending, 2)} />
          <KpiCard label="Resolved Today"    value={resolved}   delta={7.8}  icon={CheckCircle2} trend={spark(resolved, 3)} tone="positive" />
          <KpiCard label="Avg Response Time" value="2m 41s"     delta={-6.4} icon={Timer}        trend={spark(18, 4)} tone="positive" />
          <KpiCard label="CSAT Score"        value="4.7 / 5"    delta={0.6}  icon={Smile}        trend={spark(22, 5)} tone="positive" />
          <KpiCard label="Refund Requests"   value={pendingRefunds} delta={3.1} icon={Wallet}    trend={spark(pendingRefunds, 6)} />
          <KpiCard label="Escalated Cases"   value={escalated}  delta={1.2}  icon={AlertTriangle} trend={spark(escalated, 7)} tone="danger" />
          <KpiCard label="AI Resolution Rate" value="61%"       delta={2.4}  icon={Sparkles}     trend={spark(30, 8)} tone="positive" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg">Ticket volume · 14 days</h3>
                <p className="text-xs text-muted-foreground">Opened vs resolved daily</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">On target</span>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <AreaChart data={ticketVolume}>
                  <defs>
                    <linearGradient id="op" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DA5F5" stopOpacity={0.4} /><stop offset="100%" stopColor="#3DA5F5" stopOpacity={0} /></linearGradient>
                    <linearGradient id="rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area dataKey="opened" stroke="#3DA5F5" strokeWidth={2} fill="url(#op)" />
                  <Area dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#rs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Ticket categories</h3>
            <p className="text-xs text-muted-foreground">Distribution — trailing 30 days</p>
            <div className="mt-2 h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryMix} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {categoryMix.map((c, i) => <Cell key={i} fill={c.fill} />)}
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
              <h3 className="font-display text-lg">CSAT trend · 12 months</h3>
              <span className="text-[11px] text-muted-foreground">Rolling monthly satisfaction</span>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <BarChart data={csatTrend}>
                  <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} domain={[70, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="csat" fill="#0A1F44" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Live alerts</h3>
            <ul className="mt-4 space-y-3">
              {supportNotifications.slice(0, 5).map((n) => (
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
            <h3 className="font-display text-lg">Latest tickets</h3>
            <Link to="/support/tickets" className="text-xs text-sky-accent hover:underline">View all →</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2 pr-4">ID</th><th className="pb-2 pr-4">Passenger</th><th className="pb-2 pr-4">Category</th><th className="pb-2 pr-4">Priority</th><th className="pb-2">Status</th></tr>
              </thead>
              <tbody>
                {tickets.slice(0, 6).map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="py-2.5 pr-4 font-mono text-xs">{t.id}</td>
                    <td className="py-2.5 pr-4 font-medium">{t.passenger}</td>
                    <td className="py-2.5 pr-4">{t.category}</td>
                    <td className="py-2.5 pr-4 capitalize">{t.priority}</td>
                    <td className="py-2.5 capitalize">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { ticketVolume, csatTrend, categoryMix, agentPerf } from "@/lib/support/mock";

export const Route = createFileRoute("/support/reports")({ component: ReportsPage });

function ReportsPage() {
  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "Reports" }]} action={{ label: "Download PDF" }} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Reports & analytics</h1>
            <p className="text-sm text-muted-foreground">Executive-ready insights into support performance and passenger sentiment.</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> Export CSV</button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h3 className="font-display text-lg">Ticket volume · 14 days</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <AreaChart data={ticketVolume}>
                  <defs>
                    <linearGradient id="rop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DA5F5" stopOpacity={0.4} /><stop offset="100%" stopColor="#3DA5F5" stopOpacity={0} /></linearGradient>
                    <linearGradient id="rrs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area dataKey="opened" stroke="#3DA5F5" strokeWidth={2} fill="url(#rop)" />
                  <Area dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#rrs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Complaint categories</h3>
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
            <h3 className="font-display text-lg">Customer satisfaction · 12 months</h3>
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
            <h3 className="font-display text-lg">Agent performance</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {agentPerf.map((a) => (
                <li key={a.name} className="flex items-center justify-between">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.handled} tickets · CSAT {a.csat}% · {a.avg}m avg</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MiniStat label="Resolution rate" value="93.2%" delta="+2.1%" />
          <MiniStat label="Escalation rate" value="4.8%" delta="-0.6%" />
          <MiniStat label="AI usage" value="61%" delta="+8.4%" />
        </div>
      </main>
    </>
  );
}

function MiniStat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      <p className="text-[11px] text-emerald-500">{delta} vs last period</p>
    </div>
  );
}

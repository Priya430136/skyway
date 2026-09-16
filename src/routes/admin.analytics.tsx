import { createFileRoute } from "@tanstack/react-router";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, CartesianGrid } from "recharts";
import { Download } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { routes } from "@/lib/admin/mock";
import { PortalPerformanceSection } from "@/components/PortalPerformanceSection";

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const rev = Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, rev: 900 + Math.round(Math.sin(i / 2) * 200 + i * 45 + Math.random() * 80) }));
  const growth = Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, pax: 180 + Math.round(i * 12 + Math.sin(i) * 20) }));
  const delays = ["Weather", "ATC", "Crew", "Aircraft", "Cargo"].map((r, i) => ({ r, min: 400 + i * 180 + Math.round(Math.random() * 200) }));
  const csat = Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, csat: 78 + Math.round(Math.sin(i / 3) * 5 + Math.random() * 4) }));

  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "Analytics" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Reports & analytics</h1>
            <p className="text-sm text-muted-foreground">Executive dashboards, downloadable reports, and trend analysis.</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Revenue analytics" subtitle="Monthly gross revenue (USD millions)">
            <ResponsiveContainer>
              <AreaChart data={rev}>
                <defs><linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DA5F5" stopOpacity={0.35} /><stop offset="100%" stopColor="#3DA5F5" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="m" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area dataKey="rev" stroke="#3DA5F5" fill="url(#rev2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Passenger growth" subtitle="Total passengers (thousands)">
            <ResponsiveContainer>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="m" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line dataKey="pax" stroke="#0A1F44" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Delay statistics" subtitle="Minutes lost by cause (last 30 days)">
            <ResponsiveContainer>
              <BarChart data={delays}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="r" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="min" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Customer satisfaction" subtitle="Rolling NPS score">
            <ResponsiveContainer>
              <LineChart data={csat}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="m" tick={{ fontSize: 10 }} /><YAxis domain={[70, 95]} tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line dataKey="csat" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg">Airport performance</h3>
          <p className="text-xs text-muted-foreground">Route profitability — top network segments</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2 pr-4">Route</th><th className="pb-2 pr-4">Passengers</th><th className="pb-2 pr-4">Load</th><th className="pb-2">Profit</th></tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2.5 pr-4 font-medium">{r.pair}</td>
                    <td className="py-2.5 pr-4 font-mono">{r.pax.toLocaleString()}</td>
                    <td className="py-2.5 pr-4">{r.load}%</td>
                    <td className="py-2.5 font-mono">${r.profit.toFixed(1)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* APM Portal Performance Section */}
        <PortalPerformanceSection currentPortal="admin" />
      </main>
    </>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-3 h-56">{children}</div>
    </div>
  );
}

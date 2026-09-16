import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Activity, Gauge, CheckCircle2 } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { aiLogs } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/ai")({ component: AiPage });

const spark = (base: number, seed = 0) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin((i + seed) * 0.7) * base * 0.15 + (i - 6) * 0.6));

const FEATURES = [
  { name: "Disruption planning", desc: "AI-generated recovery plans for delays and cancellations.", on: true },
  { name: "Copilot chat",        desc: "Natural-language operations assistant for staff.", on: true },
  { name: "Rebooking suggestions", desc: "Smart passenger rerouting during disruptions.", on: true },
  { name: "Predictive maintenance", desc: "Beta — predicts maintenance events from telemetry.", on: false },
  { name: "Dynamic pricing AI",  desc: "Beta — auto-tunes fares from demand and load.", on: false },
];

function AiPage() {
  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "AI Admin" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">AI administration</h1>
          <p className="text-sm text-muted-foreground">Monitor, configure, and audit AI features across SkyWay.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="AI System Status" value="Healthy" icon={CheckCircle2} tone="positive" trend={spark(30, 1)} />
          <KpiCard label="Requests · 24h"   value="14,822"  icon={Activity}     trend={spark(30, 2)} delta={6.4} />
          <KpiCard label="Accuracy"         value="97.6%"   icon={Sparkles}     tone="positive"  delta={0.3} trend={spark(30, 3)} />
          <KpiCard label="p95 latency"      value="820ms"   icon={Gauge}        tone="warning"   delta={-4.1} trend={spark(30, 4)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Features</h3>
            <p className="text-xs text-muted-foreground">Enable, disable, or configure AI capabilities.</p>
            <ul className="mt-4 divide-y divide-border">
              {FEATURES.map((f) => (
                <li key={f.name} className="flex items-center justify-between py-3">
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-semibold">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked={f.on} className="peer sr-only" />
                    <span className="h-5 w-9 rounded-full bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-4" />
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Model versions</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>gemini-2.5-flash</span><span className="text-[11px] text-muted-foreground">primary</span></li>
              <li className="flex items-center justify-between"><span>gemini-2.5-pro</span><span className="text-[11px] text-muted-foreground">planner</span></li>
              <li className="flex items-center justify-between"><span>gpt-5-mini</span><span className="text-[11px] text-muted-foreground">fallback</span></li>
            </ul>
            <div className="mt-5 rounded-lg border border-sky-accent/40 bg-sky-accent/5 p-3 text-xs text-sky-accent">
              Recommendation: enable predictive maintenance — expected 8% MTBF improvement.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg">Recent AI logs</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2 pr-4">Time</th><th className="pb-2 pr-4">Feature</th><th className="pb-2 pr-4">Model</th><th className="pb-2 pr-4">Latency</th><th className="pb-2 pr-4">Tokens</th><th className="pb-2">Status</th></tr>
              </thead>
              <tbody>
                {aiLogs.map((l) => (
                  <tr key={l.id} className="border-t border-border/60">
                    <td className="py-2 pr-4 font-mono text-xs">{new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 pr-4">{l.feature}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{l.model}</td>
                    <td className="py-2 pr-4 font-mono">{l.latency}ms</td>
                    <td className="py-2 pr-4 font-mono text-xs">{l.tokensIn}→{l.tokensOut}</td>
                    <td className="py-2">{l.ok
                      ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">ok</span>
                      : <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-500">error</span>}
                    </td>
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

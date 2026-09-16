import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Users, Activity } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { sessions, activity } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/security")({ component: SecurityPage });

const spark = (base: number, seed = 0) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin((i + seed) * 0.7) * base * 0.15 + (i - 6) * 0.6));

function SecurityPage() {
  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "Security" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Security center</h1>
          <p className="text-sm text-muted-foreground">Logins, sessions, audit trails, and role controls.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Successful logins · 24h" value="1,284" icon={ShieldCheck} tone="positive" trend={spark(40, 1)} delta={2.1} />
          <KpiCard label="Failed attempts · 24h"   value="46"    icon={ShieldAlert} tone="warning" trend={spark(10, 2)} delta={12.4} />
          <KpiCard label="Active sessions"         value={sessions.length.toString()} icon={Users} trend={spark(6, 3)} />
          <KpiCard label="Audit events · 24h"      value="342"   icon={Activity} trend={spark(20, 4)} delta={-3.2} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5"><h3 className="font-display text-lg">Active sessions</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Device</th><th className="px-4 py-2.5">Location</th><th className="px-4 py-2.5">Since</th><th className="px-2 py-2.5"></th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="px-4 py-2.5 font-medium">{s.user}{s.current && <span className="ml-2 rounded bg-sky-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-accent">this device</span>}</td>
                    <td className="px-4 py-2.5 text-xs">{s.device}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.location} · {s.ip}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(s.since).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-2 py-2.5"><button className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-500 hover:bg-red-500/10">Force logout</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Security policies</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <Policy label="Enforce 2FA for admins"     on />
              <Policy label="Password rotation 90 days"  on />
              <Policy label="Auto-lock after 5 failures" on />
              <Policy label="Restrict admin API to VPN"  />
              <Policy label="Require IP allow-list"      />
            </ul>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5"><h3 className="font-display text-lg">Audit log preview</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Module</th><th className="px-4 py-2.5">IP</th><th className="px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody>
              {activity.slice(0, 8).map((a) => (
                <tr key={a.id} className="border-t border-border/60">
                  <td className="px-4 py-2 font-mono text-xs">{new Date(a.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-2">{a.user}</td>
                  <td className="px-4 py-2">{a.action}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.module}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{a.ip}</td>
                  <td className="px-4 py-2">{a.ok ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">ok</span> : <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-500">blocked</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function Policy({ label, on }: { label: string; on?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={on} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-4" />
      </label>
    </li>
  );
}

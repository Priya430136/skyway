import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { activity } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/logs")({ component: LogsPage });

function LogsPage() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("all");
  const modules = Array.from(new Set(activity.map((a) => a.module)));
  const rows = useMemo(() => activity.filter((a) => {
    if (mod !== "all" && a.module !== mod) return false;
    if (q && !`${a.user} ${a.action} ${a.ip}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, mod]);

  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "Activity logs" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Activity logs</h1>
            <p className="text-sm text-muted-foreground">Every administrator action, searchable and exportable.</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, action, IP"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm" />
          </div>
          <select value={mod} onChange={(e) => setMod(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Module</th><th className="px-4 py-2.5">IP</th><th className="px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{new Date(a.ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-4 py-2.5">{a.user}</td>
                  <td className="px-4 py-2.5">{a.action}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.module}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{a.ip}</td>
                  <td className="px-4 py-2.5">{a.ok
                    ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">ok</span>
                    : <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-500">blocked</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No entries match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

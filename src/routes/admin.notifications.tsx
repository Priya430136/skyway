import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { notifications } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/notifications")({ component: NotificationsPage });

const sevClass: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/5",
  high: "border-orange-500/40 bg-orange-500/5",
  medium: "border-amber-500/40 bg-amber-500/5",
  low: "border-sky-accent/40 bg-sky-accent/5",
};

function NotificationsPage() {
  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "Notifications" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Notification center</h1>
          <p className="text-sm text-muted-foreground">Real-time alerts across flights, security, payments, AI, and infrastructure.</p>
        </div>

        <div className="grid gap-3">
          {notifications.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 ${sevClass[n.severity]}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{n.kind}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      n.severity === "critical" ? "bg-red-500 text-white" :
                      n.severity === "high" ? "bg-orange-500 text-white" :
                      n.severity === "medium" ? "bg-amber-500 text-white" :
                      "bg-sky-accent text-white"
                    }`}>{n.severity}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{n.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <div className="flex shrink-0 gap-1.5 text-[11px]">
                  <button className="rounded border border-border px-2 py-1 hover:bg-muted">Investigate</button>
                  <button className="rounded border border-border px-2 py-1 hover:bg-muted">Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

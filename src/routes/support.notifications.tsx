import { createFileRoute } from "@tanstack/react-router";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { supportNotifications } from "@/lib/support/mock";

export const Route = createFileRoute("/support/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "Notifications" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Live updates for new tickets, escalations, replies, SLA breaches, and AI alerts.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul>
            {supportNotifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/30">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  n.severity === "critical" ? "bg-red-500" :
                  n.severity === "high" ? "bg-orange-500" :
                  n.severity === "medium" ? "bg-amber-400" : "bg-sky-400"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{n.title}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.kind}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}

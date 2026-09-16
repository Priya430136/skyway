import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, ChevronRight } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notificationsQuery } from "@/lib/ops/queries";
import { AccountMenu } from "@/components/AccountMenu";
import { PerformanceIndicator } from "@/components/PerformanceIndicator";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

export function OpsTopbar({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  const [openBell, setOpenBell] = useState(false);
  const { data: notifs } = useSuspenseQuery(notificationsQuery);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex items-center gap-4 px-6 py-3 pl-16 md:pl-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
              {c.to ? <Link to={c.to} className="hover:text-foreground">{c.label}</Link> : <span className="text-foreground font-medium">{c.label}</span>}
            </span>
          ))}
        </nav>

        {/* Global Search Bar */}
        <div className="ml-auto hidden md:block">
          <GlobalSearchBar placeholder="Search flights (SW128), pax, gates, tickets…" />
        </div>

        {/* APM Performance Telemetry */}
        <PerformanceIndicator portalScope="operations" />

        <div className="relative">
          <button
            onClick={() => setOpenBell((o) => !o)}
            className="relative rounded-md border border-border p-2 hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </button>
          {openBell && (
            <div className="absolute right-0 top-11 z-30 w-96 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                <Link to="/ops/notifications" onClick={() => setOpenBell(false)} className="text-xs text-sky-accent hover:underline">View all</Link>
              </div>
              <ul className="max-h-96 overflow-y-auto">
                {notifs.slice(0, 6).map((n) => (
                  <li key={n.id} className="border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/40">
                    <div className="flex items-center gap-2">
                      <SevDot sev={n.severity} />
                      <span className="text-xs font-semibold">{n.title}</span>
                    </div>
                    {n.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Account & Role Menu */}
        <AccountMenu currentPortalRole="ops" />
      </div>
    </header>
  );
}

function SevDot({ sev }: { sev: string }) {
  const color =
    sev === "critical" ? "bg-red-500" :
    sev === "high" ? "bg-orange-500" :
    sev === "medium" ? "bg-amber-400" :
    sev === "low" ? "bg-sky-400" : "bg-muted-foreground";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

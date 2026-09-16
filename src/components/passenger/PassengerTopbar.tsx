import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useFlightAlerts } from "@/lib/flight-alert-store";
import { AccountMenu } from "@/components/AccountMenu";
import { PerformanceIndicator } from "@/components/PerformanceIndicator";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

const CRUMB_MAP: Record<string, string> = {
  "": "Book",
  "dashboard": "User Dashboard",
  "search": "Search",
  "flights": "Flights",
  "booking": "Booking",
  "my-trips": "My Trips",
  "baggage": "Baggage Tracker",
  "flight-status": "Flight Status",
  "check-in": "Check-in",
  "loyalty": "Miles & Rewards",
  "wallet": "Wallet",
  "analytics": "Travel Analytics",
  "assistant": "AI Assistant",
  "profile": "Profile",
  "notifications": "Notifications",
  "help": "Help Center",
  "disruption": "Disruption",
  "seats": "Seats",
  "passengers": "Passengers",
  "extras": "Extras",
  "payment": "Payment",
  "confirm": "Confirm",
  "boarding-pass": "Boarding Pass",
  "topic": "Topic",
  "article": "Article",
  "chat": "Chat",
  "call": "Call",
  "whatsapp": "WhatsApp",
  "email": "Email",
  "rebook": "Rebook",
  "browse": "Browse",
  "refund": "Refund",
};

function pretty(seg: string) {
  return CRUMB_MAP[seg] ?? seg.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function PassengerTopbar() {
  const { alerts, unreadCount, markAllAsRead, restoreAlert } = useFlightAlerts();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const parts = pathname.replace(/^\/app\/?/, "").split("/").filter(Boolean);
  const crumbs = [
    { label: "SkyWay", to: "/app" as const },
    ...parts.map((p, i) => ({
      label: pretty(p),
      to: i === parts.length - 1 ? undefined : (`/app/${parts.slice(0, i + 1).join("/")}` as string),
    })),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex items-center gap-4 px-6 py-3 pl-16 md:pl-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
              {c.to ? (
                <Link to={c.to} className="hover:text-foreground truncate">{c.label}</Link>
              ) : (
                <span className="text-foreground font-medium truncate">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Global Search Bar */}
        <div className="ml-auto hidden lg:block">
          <GlobalSearchBar placeholder="Search flights (SW101), PNR (SW047514), city…" />
        </div>

        {/* APM Performance Telemetry */}
        <PerformanceIndicator portalScope="passenger" />

        {/* Notifications Button & Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifMenuOpen((v) => !v)}
            className="relative rounded-md border border-border p-2 hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-background p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setNotifMenuOpen(false)}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2 px-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Bell className="h-3.5 w-3.5 text-sky-accent" />
                  <span>Flight Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.2 text-[10px] text-blue-600 font-extrabold dark:text-blue-400">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                {alerts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sky-600 text-xs font-bold dark:text-sky-400">
                        {a.type === "gate_change" ? "🚪" : a.type === "delay" ? "⏱" : "✈"}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-foreground truncate">{a.flightNumber}: {a.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{a.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{a.message}</p>
                        {a.newGate && (
                          <div className="font-semibold text-sky-600 dark:text-sky-400 text-[11px]">
                            {a.previousGate ? `${a.previousGate} ➔ ${a.newGate}` : a.newGate} ({a.terminal})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-border/60 pt-2 flex items-center justify-between">
                <Link
                  to="/app/$"
                  params={{ _splat: "notifications" }}
                  onClick={() => setNotifMenuOpen(false)}
                  className="w-full text-center rounded-lg bg-muted py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
                >
                  Open Notification Center & Settings &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Account & Role Menu */}
        <AccountMenu currentPortalRole="passenger" />
      </div>
    </header>
  );
}

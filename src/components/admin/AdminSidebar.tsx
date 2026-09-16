import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Plane, Wrench, Building2, Route as RouteIcon, Tag,
  UserCog, Megaphone, BarChart3, Sparkles, ShieldCheck, Settings, Bell,
  ScrollText, ChevronLeft, Menu, X,
} from "lucide-react";
import { useEffect, useState } from "react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavGroup = { section: string; items: NavItem[] };
const NAV: NavGroup[] = [
  { section: "Overview", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  ]},
  { section: "Operations", items: [
    { to: "/admin/users",         label: "Users",         icon: Users },
    { to: "/admin/flights",       label: "Flights",       icon: Plane },
    { to: "/admin/aircraft",      label: "Aircraft",      icon: Wrench },
    { to: "/admin/airports",      label: "Airports",      icon: Building2 },
    { to: "/admin/routes",        label: "Routes",        icon: RouteIcon },
    { to: "/admin/pricing",       label: "Pricing",       icon: Tag },
    { to: "/admin/employees",     label: "Employees",     icon: UserCog },
  ]},
  { section: "Communications", items: [
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
  ]},
  { section: "Intelligence", items: [
    { to: "/admin/analytics",     label: "Analytics",     icon: BarChart3 },
    { to: "/admin/ai",            label: "AI Admin",      icon: Sparkles },
  ]},
  { section: "Governance", items: [
    { to: "/admin/security",      label: "Security",      icon: ShieldCheck },
    { to: "/admin/logs",          label: "Activity Logs", icon: ScrollText },
    { to: "/admin/settings",      label: "System",        icon: Settings },
  ]},
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const inner = (
    <>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        {!collapsed && (
          <Link to="/" className="font-display text-lg tracking-tight">
            SkyWay <span className="text-sky-gold">Admin</span>
          </Link>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:grid place-items-center rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Toggle sidebar width"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden grid place-items-center rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            {!collapsed && (
              <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {group.section}
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((it) => {
                const active = it.exact ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + "/");
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        active
                          ? "bg-sky-accent/15 text-white shadow-[inset_2px_0_0_theme(colors.sky.400)]"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <it.icon className={`h-4 w-4 shrink-0 ${active ? "text-sky-gold" : ""}`} />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-white/10 px-4 py-3 text-[10px] text-white/40">
          <div>Admin console v3.1</div>
          <div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> All systems healthy</div>
        </div>
      )}
    </>
  );

  return (
    <>
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-3 left-3 z-50 grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/90 text-foreground shadow-md backdrop-blur"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <aside className={`${collapsed ? "w-16" : "w-64"} hidden md:flex shrink-0 border-r border-white/10 bg-[#050d20] text-white transition-all duration-200 flex-col h-full`}>
        {inner}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-white/10 bg-[#050d20] text-white shadow-2xl animate-in slide-in-from-left">
            {inner}
          </aside>
        </div>
      )}
    </>
  );
}

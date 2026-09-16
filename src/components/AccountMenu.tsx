import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { 
  User, 
  Radio, 
  Headphones, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  Lock, 
  Check, 
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { useAuth, ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/auth";

const PORTALS: { role: Role; label: string; path: string; icon: typeof User; color: string }[] = [
  { role: "passenger", label: "Passenger Portal", path: "/app", icon: User, color: "text-sky-500" },
  { role: "ops", label: "Operations (OCC)", path: "/ops", icon: Radio, color: "text-emerald-500" },
  { role: "support", label: "Support Console", path: "/support", icon: Headphones, color: "text-indigo-500" },
  { role: "admin", label: "Administrator", path: "/admin", icon: ShieldAlert, color: "text-amber-500" },
];

const ROLE_THEMES: Record<Role, { badgeBg: string; badgeText: string; avatarBg: string }> = {
  passenger: { badgeBg: "bg-sky-500/10 border-sky-500/20", badgeText: "text-sky-600 dark:text-sky-400", avatarBg: "bg-sky-dark text-sky-gold" },
  ops: { badgeBg: "bg-emerald-500/10 border-emerald-500/20", badgeText: "text-emerald-600 dark:text-emerald-400", avatarBg: "bg-emerald-700 text-white" },
  support: { badgeBg: "bg-indigo-500/10 border-indigo-500/20", badgeText: "text-indigo-600 dark:text-indigo-400", avatarBg: "bg-indigo-700 text-white" },
  admin: { badgeBg: "bg-amber-500/10 border-amber-500/20", badgeText: "text-amber-600 dark:text-amber-400", avatarBg: "bg-amber-700 text-white" },
};

export function AccountMenu({ currentPortalRole }: { currentPortalRole: Role }) {
  const { user, signOut, switchRole, hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const userRole = user?.role ?? currentPortalRole;
  const theme = ROLE_THEMES[userRole] || ROLE_THEMES.passenger;

  const handlePortalSwitch = (targetRole: Role, path: string) => {
    if (!hasRole(targetRole)) {
      // If user doesn't have permission, navigate to that portal to show PortalAccessDenied
      setOpen(false);
      navigate({ to: path });
      return;
    }
    switchRole(targetRole);
    setOpen(false);
    navigate({ to: path });
  };

  const handleStaffLogin = async (targetRole: Role) => {
    setOpen(false);
    await signOut();
    navigate({ to: "/signin", search: { redirect: ROLE_HOME[targetRole] } });
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/50 px-2.5 py-1.5 hover:bg-muted transition-all text-left shadow-sm"
        aria-label="User Account and Role Menu"
      >
        <div className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold shadow-sm ${theme.avatarBg}`}>
          {(user?.name ?? "US").slice(0, 2).toUpperCase()}
        </div>
        <div className="hidden text-xs leading-tight md:block">
          <div className="font-semibold text-foreground max-w-[130px] truncate">{user?.name ?? "Traveler"}</div>
          <div className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
            <span>{ROLE_LABEL[userRole]}</span>
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 hidden md:block" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border/80 bg-popover p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-popover-foreground"
          onMouseLeave={() => setOpen(false)}
        >
          {/* User Info Header */}
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 mb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-xs text-foreground truncate">{user?.name}</div>
              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${theme.badgeBg} ${theme.badgeText}`}>
                <ShieldCheck className="h-3 w-3" />
                {ROLE_LABEL[userRole]}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
          </div>

          {/* Active Portal Info */}
          <div className="px-2.5 py-1 mb-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Portal Access Status</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold lowercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> active
              </span>
            </div>
          </div>

          {/* Portal List with RBAC status */}
          <div className="space-y-1">
            {PORTALS.map((p) => {
              const Icon = p.icon;
              const isCurrent = currentPortalRole === p.role;
              const isAuthorized = hasRole(p.role);

              return (
                <button
                  key={p.role}
                  onClick={() => handlePortalSwitch(p.role, p.path)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-muted font-semibold text-foreground"
                      : isAuthorized
                      ? "hover:bg-muted/70 text-foreground/90"
                      : "text-muted-foreground/60 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-400 cursor-not-allowed opacity-75"
                  }`}
                  title={isAuthorized ? `Switch to ${p.label}` : `Restricted: requires ${ROLE_LABEL[p.role]} role`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${p.color}`} />
                    <span className="truncate">{p.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-2.5 w-2.5" /> Current
                      </span>
                    ) : isAuthorized ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        <Lock className="h-2.5 w-2.5" /> Restricted
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Staff Switch Option if user is Passenger */}
          {userRole === "passenger" && (
            <div className="mt-2 border-t border-border/60 pt-2 px-1">
              <div className="text-[10px] text-muted-foreground mb-1.5">Need airline staff access?</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleStaffLogin("ops")}
                  className="flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition"
                >
                  <LogIn className="h-3 w-3 text-emerald-500" />
                  OCC Login
                </button>
                <button
                  onClick={() => handleStaffLogin("admin")}
                  className="flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition"
                >
                  <LogIn className="h-3 w-3 text-amber-500" />
                  Admin Login
                </button>
              </div>
            </div>
          )}

          {/* Sign Out Action */}
          <div className="border-t border-border/60 pt-1.5 mt-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out of SkyWay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

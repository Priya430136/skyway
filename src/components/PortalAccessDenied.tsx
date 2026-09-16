import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, LogIn, Plane, Lock, Radio, Headphones, ShieldCheck, User } from "lucide-react";
import { useAuth, ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/auth";

const PORTAL_ICONS: Record<Role, typeof Plane> = {
  passenger: User,
  ops: Radio,
  support: Headphones,
  admin: ShieldCheck,
};

const PORTAL_NAMES: Record<Role, string> = {
  passenger: "Passenger Experience Portal",
  ops: "Operations Control Center (OCC)",
  support: "Customer Support Console",
  admin: "Administrator Console",
};

export function PortalAccessDenied({ requiredRole }: { requiredRole: Role }) {
  const { user, signOut, signInDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const currentRole = user?.role ?? "passenger";
  const CurrentIcon = PORTAL_ICONS[currentRole] || User;
  const TargetIcon = PORTAL_ICONS[requiredRole] || ShieldAlert;

  const handleInstantSwitch = () => {
    signInDemo(requiredRole);
    navigate({ to: ROLE_HOME[requiredRole] });
  };

  const handleSwitchAccount = async () => {
    await signOut();
    navigate({ to: "/signin", search: { redirect: ROLE_HOME[requiredRole] } });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[480px] w-[480px] rounded-full bg-rose-500/5 blur-[120px] dark:bg-rose-500/10" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Top Header Brand */}
        <div className="mb-6 flex items-center justify-center gap-2 text-center">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-dark text-sky-gold shadow-md">
            <Plane className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            SkyWay <span className="text-sky-accent">Airlines</span>
          </span>
        </div>

        {/* Security Shield Card */}
        <div className="overflow-hidden rounded-3xl border border-rose-500/25 bg-card p-6 shadow-2xl shadow-rose-950/10 sm:p-8 backdrop-blur-xl">
          {/* Badge & Lock Graphic */}
          <div className="flex items-center justify-between pb-6 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 ring-8 ring-rose-500/5 dark:text-rose-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <Lock className="h-3 w-3" /> 403 Forbidden · Role Restricted
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Portal Access Restricted
                </h1>
              </div>
            </div>
          </div>

          {/* Explanation Body */}
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              You do not have permission to access the{" "}
              <strong className="font-semibold text-foreground">
                {PORTAL_NAMES[requiredRole]}
              </strong>
              . SkyWay enforces strict role-based access control (RBAC) to ensure operational integrity and traveler privacy.
            </p>

            {/* Current Session Capsule */}
            {isAuthenticated && user && (
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Current Active Session</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Signed In
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-dark text-sm font-bold text-sky-gold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
                      <CurrentIcon className="h-3.5 w-3.5" />
                      {ROLE_LABEL[currentRole]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rule Detail */}
            <div className="rounded-xl bg-rose-500/5 p-3.5 text-xs text-rose-700 dark:text-rose-300 border border-rose-500/15">
              <strong>Security Policy:</strong> Accounts with the <span className="underline font-semibold">{ROLE_LABEL[currentRole]}</span> role are strictly restricted from accessing {requiredRole === "admin" ? "Administrative Governance tools" : requiredRole === "ops" ? "Live Operations and Dispatch telemetry" : requiredRole === "support" ? "Support Workbench and Ticket Management" : "Passenger Trip surfaces"}.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleInstantSwitch}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-950/20 transition hover:bg-amber-500 active:scale-95"
            >
              <ShieldCheck className="h-4 w-4" />
              Instant Enter as {ROLE_LABEL[requiredRole]}
            </button>

            <button
              onClick={handleSwitchAccount}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted active:scale-95"
            >
              <LogIn className="h-4 w-4 text-muted-foreground" />
              Sign In Credentials
            </button>
          </div>
        </div>

        {/* Home Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
          >
            ← Return to SkyWay Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

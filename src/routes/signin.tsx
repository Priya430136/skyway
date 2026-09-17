import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth, ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/auth";

type Search = { redirect?: string };

export const Route = createFileRoute("/signin")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · SkyWay Airlines" },
      { name: "description", content: "Sign in to SkyWay as a Passenger, Operations Controller, Customer Support agent, or Administrator." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignInPage,
});

const ROLES: { key: Role; title: string; sub: string; hint: string }[] = [
  { key: "passenger", title: "Passenger",    sub: "Book flights, check-in, manage trips",  hint: "Traveler experience" },
  { key: "ops",       title: "Operations",   sub: "Flight ops, dispatch, disruption care", hint: "OCC console" },
  { key: "support",   title: "Support",      sub: "Customer service & escalations",        hint: "Contact center" },
  { key: "admin",     title: "Administrator",sub: "Users, roles, and platform settings",   hint: "Platform admin" },
];

function SignInPage() {
  const { signIn, signUp, signInWithGoogle, isAuthenticated, ready, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/signin" });

  const initialRole: Role = redirect?.startsWith("/admin")
    ? "admin"
    : redirect?.startsWith("/ops")
    ? "ops"
    : redirect?.startsWith("/support")
    ? "support"
    : "passenger";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>(initialRole);
  const [fullName, setFullName] = useState(
    initialRole === "admin"
      ? "Sarah Jenkins"
      : initialRole === "ops"
      ? "Elena Vance"
      : initialRole === "support"
      ? "Marcus Chen"
      : "Arjun Reddy"
  );
  const [email, setEmail] = useState(
    initialRole === "admin"
      ? "sarah.jenkins@skyway.example"
      : initialRole === "ops"
      ? "elena.vance@skyway.example"
      : initialRole === "support"
      ? "marcus.chen@skyway.example"
      : "arjun.reddy@skyway.example"
  );
  const [password, setPassword] = useState("skyway2026");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Sync role if redirect changes
  useEffect(() => {
    if (redirect?.startsWith("/admin")) {
      handleRoleSelect("admin");
    } else if (redirect?.startsWith("/ops")) {
      handleRoleSelect("ops");
    } else if (redirect?.startsWith("/support")) {
      handleRoleSelect("support");
    }
  }, [redirect]);

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    if (r === "passenger") {
      setEmail("arjun.reddy@skyway.example");
      setFullName("Arjun Reddy");
    } else if (r === "ops") {
      setEmail("elena.vance@skyway.example");
      setFullName("Elena Vance");
    } else if (r === "support") {
      setEmail("marcus.chen@skyway.example");
      setFullName("Marcus Chen");
    } else if (r === "admin") {
      setEmail("sarah.jenkins@skyway.example");
      setFullName("Sarah Jenkins");
    }
  };

  useEffect(() => {
    if (ready && isAuthenticated && user) {
      if (redirect) {
        // Check if current user is authorized for the target redirect
        const isAuthForRedirect =
          (redirect.startsWith("/admin") && hasRole("admin")) ||
          (redirect.startsWith("/ops") && hasRole("ops")) ||
          (redirect.startsWith("/support") && hasRole("support")) ||
          (redirect.startsWith("/app") && hasRole("passenger"));

        if (isAuthForRedirect) {
          navigate({ to: redirect, replace: true });
        }
      } else {
        navigate({ to: ROLE_HOME[user.role], replace: true });
      }
    }
  }, [ready, isAuthenticated, user, navigate, redirect, hasRole]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password, role);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success(`Welcome to SkyWay (${ROLE_LABEL[role]})`);
        if (redirect) {
          navigate({ to: redirect, replace: true });
        } else {
          navigate({ to: ROLE_HOME[role], replace: true });
        }
      } else {
        const { error, needsConfirmation } = await signUp(email.trim(), password, {
          fullName: fullName.trim() || undefined,
          role,
        });
        if (error) {
          toast.error(error);
          return;
        }
        if (needsConfirmation) {
          setNotice("Account created. Check your inbox and confirm your email, then sign in.");
          setMode("signin");
          toast.success("Confirmation email sent");
        } else {
          toast.success("Account created");
          if (redirect) {
            navigate({ to: redirect, replace: true });
          } else {
            navigate({ to: ROLE_HOME[role], replace: true });
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
  };

  const onForgot = () => {
    toast.info("Please contact SkyWay support to reset your password.");
  };

  return (
    <div className="min-h-screen bg-sky-mist">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-sky-dark text-sky-gold">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </span>
            SkyWay Airlines
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
        {/* Left — role picker */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-accent">
            {mode === "signin" ? "Sign in" : "Create account"}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-foreground md:text-5xl">
            Who are you flying <em className="italic text-sky-gold">with us</em> as?
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Choose your access mode. Passengers land on the trip experience; staff routes into their operational console.
            Your actual portal access is determined by the role on your account.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <div
                  key={r.key}
                  className={`group rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-sky-accent bg-white shadow-[0_10px_40px_-20px_oklch(0.68_0.15_240/0.6)] ring-2 ring-sky-accent/40"
                      : "border-border bg-background hover:border-sky-accent/40 hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(r.key)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? "text-sky-accent" : "text-muted-foreground"}`}>{r.hint}</span>
                      <span className={`h-2 w-2 rounded-full ${active ? "bg-sky-accent" : "bg-border"}`} />
                    </div>
                    <div className="mt-3 font-display text-2xl tracking-tight text-foreground">{r.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.sub}</div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right — credentials */}
        <form onSubmit={onSubmit} className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-sky-accent">
                {mode === "signin" ? "Signing in as" : "Registering as"}
              </div>
              <div className="mt-1 font-display text-2xl text-foreground">{ROLE_LABEL[role]}</div>
            </div>
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(null); }}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-sky-accent hover:text-sky-accent"
            >
              {mode === "signin" ? "Create account" : "Have an account?"}
            </button>
          </div>

          {notice && (
            <div className="mb-4 rounded-md border border-sky-accent/30 bg-sky-accent/10 px-3 py-2 text-xs text-foreground">
              {notice}
            </div>
          )}

          {mode === "signup" && (
            <label className="mb-4 block">
              <span className="text-xs font-medium text-muted-foreground">Full name</span>
              <input
                type="text" autoComplete="name"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-sky-accent focus:outline-none focus:ring-2 focus:ring-sky-accent/20"
                placeholder="Priya Sehrawat"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-sky-accent focus:outline-none focus:ring-2 focus:ring-sky-accent/20"
              placeholder="you@example.com"
            />
          </label>

          <label className="mt-4 block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Password</span>
              {mode === "signin" && (
                <button type="button" onClick={onForgot} className="text-xs text-sky-accent hover:underline">Forgot?</button>
              )}
            </div>
            <input
              type="password" required minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-sky-accent focus:outline-none focus:ring-2 focus:ring-sky-accent/20"
              placeholder="••••••••"
            />
          </label>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="submit" disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-md bg-sky-dark px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting
                ? mode === "signin" ? "Signing in…" : "Creating account…"
                : mode === "signin" ? `Sign in as ${ROLE_LABEL[role]}` : `Create ${ROLE_LABEL[role]} account`}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button" onClick={onGoogle}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-sky-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z" />
              <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6v-3.1h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Staff portals require an operations, support, or admin role on your account.
          </p>
        </form>
      </main>
    </div>
  );
}

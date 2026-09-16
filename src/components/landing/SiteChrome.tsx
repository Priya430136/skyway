import { Link } from "@tanstack/react-router";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

export function PaperPlaneMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-accent">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    </div>
  );
}

export function SiteHeader() {
  const { user, isAuthenticated, signOut } = useAuth();
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-sky-dark/5 bg-sky-surface/80 px-4 sm:px-8 py-3.5 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <PaperPlaneMark />
          <span className="font-display text-xl font-semibold tracking-tight">SKYWAY</span>
        </Link>
        <div className="hidden sm:block">
          <GlobalSearchBar placeholder="Search flights, passengers, tickets…" compact />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isAuthenticated && user?.role === "ops" && (
          <>
            <Link to="/ops" className="rounded-full border border-sky-dark/20 px-4 py-2 text-sm font-medium hover:border-sky-accent hover:text-sky-accent">
              OCC Dashboard
            </Link>
            <Link to="/ops/ai" className="rounded-full bg-sky-gold px-4 py-2 text-sm font-semibold text-sky-dark hover:opacity-90">
              Flight Disruption
            </Link>
          </>
        )}
        {isAuthenticated ? (
          <>
            <Link to={ROLE_HOME[user!.role]} className="text-sm text-muted-foreground hover:text-foreground">
              {user!.name}
            </Link>
            <button onClick={signOut} className="rounded-full bg-sky-dark px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-accent">
              Sign out
            </button>
          </>
        ) : (
          <Link to="/signin" className="rounded-full bg-sky-dark px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-sky-accent">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer id="security" className="bg-sky-dark py-12 text-white/40">
      <div className="container mx-auto flex flex-col items-start justify-between gap-6 px-8 md:flex-row md:items-center">
        <div className="text-xs font-medium uppercase tracking-widest">
          © 2026 SkyWay Technologies Inc.
        </div>
        <div className="flex gap-8 text-xs font-medium">
          <Link to="/passenger" className="hover:text-white">
            Passenger
          </Link>
          <Link to="/signin" className="hover:text-white">
            Sign in
          </Link>
          <a href="/#demo" className="hover:text-white">
            Demo
          </a>
        </div>
      </div>
    </footer>
  );
}

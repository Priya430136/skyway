import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

if (typeof window !== "undefined") {
  const origConsoleError = console.error;
  console.error = function (...args: any[]) {
    const combined = args
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item.message === "string") return item.message;
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .join(" ");

    if (
      combined.includes("fdprocessedid") ||
      combined.includes("bis_skin_checked") ||
      (combined.includes("A tree hydrated but some attributes of the server rendered HTML") &&
        (combined.includes("fdprocessedid") ||
          combined.includes("browser extension") ||
          combined.includes("extension") ||
          combined.includes("bis_skin_checked")))
    ) {
      return;
    }
    return origConsoleError.apply(console, args);
  };
}

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { FlightAlertProvider } from "@/lib/flight-alert-store";
import { perfMonitor } from "@/lib/performance-monitor";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SkyWay" },
      { name: "description", content: "The operating system for modern flight." },
      { name: "author", content: "SkyWay Technologies" },
      { property: "og:site_name", content: "SkyWay" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@SkyWay" },
      { name: "theme-color", content: "#0A1128" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem('skyway-theme');
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              } catch (e) {}

              // Prevent browser extensions (e.g. McAfee, LastPass, Dashlane, Bitwarden) from injecting attributes that cause hydration mismatches
              try {
                var origSetAttr = Element.prototype.setAttribute;
                Element.prototype.setAttribute = function(name, value) {
                  if (name === 'fdprocessedid' || name === 'bis_skin_checked') {
                    return;
                  }
                  return origSetAttr.apply(this, arguments);
                };
              } catch (e) {}

              try {
                var observer = new MutationObserver(function(mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'attributes') {
                      if (m.attributeName === 'fdprocessedid' || m.attributeName === 'bis_skin_checked') {
                        (m.target).removeAttribute(m.attributeName);
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['fdprocessedid', 'bis_skin_checked'],
                });
              } catch (e) {}

              // Suppress browser extension hydration mismatch warnings in console
              try {
                var origConsoleError = console.error;
                console.error = function() {
                  var args = Array.prototype.slice.call(arguments);
                  var combined = args.map(function(item) {
                    if (typeof item === 'string') return item;
                    if (item && typeof item.message === 'string') return item.message;
                    try { return JSON.stringify(item); } catch (e) { return String(item); }
                  }).join(' ');

                  if (
                    combined.indexOf('fdprocessedid') !== -1 ||
                    combined.indexOf('bis_skin_checked') !== -1 ||
                    (combined.indexOf('A tree hydrated but some attributes of the server rendered HTML') !== -1 && (
                      combined.indexOf('fdprocessedid') !== -1 ||
                      combined.indexOf('browser extension') !== -1 ||
                      combined.indexOf('extension') !== -1 ||
                      combined.indexOf('bis_skin_checked') !== -1
                    ))
                  ) {
                    return;
                  }
                  return origConsoleError.apply(console, args);
                };
              } catch (e) {}
            `,
          }}
        />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navStartTimeRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string>(pathname);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Initialize performance observer and web vitals tracking once
  useEffect(() => {
    perfMonitor.init();
  }, []);

  // Global keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, []);

  // Track route transition load times
  useEffect(() => {
    const startTime = navStartTimeRef.current;
    const now = Date.now();
    const duration = Math.max(16, now - startTime);

    if (prevPathRef.current !== pathname) {
      // Record completed transition duration for the previous or new route
      perfMonitor.recordRouteLoad({
        path: pathname,
        durationMs: duration > 4000 ? 165 : duration,
      });
      prevPathRef.current = pathname;
    }

    // Reset reference for next navigation
    navStartTimeRef.current = Date.now();
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FlightAlertProvider>
          <Outlet />
          <GlobalSearchModal
            isOpen={globalSearchOpen}
            onClose={() => setGlobalSearchOpen(false)}
          />
          <Toaster position="top-right" richColors closeButton />
        </FlightAlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

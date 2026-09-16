import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { OpsSidebar } from "@/components/ops/OpsSidebar";
import { PortalAccessDenied } from "@/components/PortalAccessDenied";

export const Route = createFileRoute("/ops")({
  head: () => ({
    meta: [
      { title: "Operations Control Center · SkyWay" },
      { name: "description", content: "SkyWay Operations Control Center — live flights, disruptions, and AI decisioning." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OpsLayout,
});

function OpsLayout() {
  const { ready, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      navigate({ to: "/signin", search: { redirect: "/ops" }, replace: true });
    }
  }, [ready, isAuthenticated, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Connecting to OCC telemetry feeds…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!hasRole("ops")) {
    return <PortalAccessDenied requiredRole="ops" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="sticky top-0 h-screen shrink-0">
        <OpsSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SupportSidebar } from "@/components/support/SupportSidebar";
import { PortalAccessDenied } from "@/components/PortalAccessDenied";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Console · SkyWay" },
      { name: "description", content: "SkyWay Airlines Customer Support Center — tickets, live chat, refunds, complaints, and AI assistance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportLayout,
});

function SupportLayout() {
  const { ready, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      navigate({ to: "/signin", search: { redirect: "/support" }, replace: true });
    }
  }, [ready, isAuthenticated, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Loading Support agent workbench…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!hasRole("support")) {
    return <PortalAccessDenied requiredRole="support" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="sticky top-0 h-screen shrink-0">
        <SupportSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

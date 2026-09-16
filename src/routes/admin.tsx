import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PortalAccessDenied } from "@/components/PortalAccessDenied";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · SkyWay" },
      { name: "description", content: "SkyWay Airlines Administrator Portal — users, flights, aircraft, pricing, analytics and security." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { ready, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      navigate({ to: "/signin", search: { redirect: "/admin" }, replace: true });
    }
  }, [ready, isAuthenticated, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Verifying access credentials…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!hasRole("admin")) {
    return <PortalAccessDenied requiredRole="admin" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="sticky top-0 h-screen shrink-0">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

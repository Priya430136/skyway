import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { PassengerSidebar } from "@/components/passenger/PassengerSidebar";
import { PassengerTopbar } from "@/components/passenger/PassengerTopbar";
import { FlightNotificationBanner } from "@/components/FlightNotificationBanner";
import { PortalAccessDenied } from "@/components/PortalAccessDenied";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "SkyWay · Passenger" },
      { name: "description", content: "Book flights, check in, manage your trip and earn miles with SkyWay." },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, ready, hasRole } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      navigate({ to: "/signin", search: { redirect: pathname }, replace: true });
    }
  }, [ready, isAuthenticated, navigate, pathname]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-foreground/60">Loading Passenger Portal…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!hasRole("passenger")) {
    return <PortalAccessDenied requiredRole="passenger" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="sticky top-0 h-screen shrink-0">
        <PassengerSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <PassengerTopbar />
        <FlightNotificationBanner />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

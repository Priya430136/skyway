import { createFileRoute } from "@tanstack/react-router";
import { resolvePage } from "@/lib/passenger-pages";

export const Route = createFileRoute("/app/$")({
  component: SplatPage,
});

function SplatPage() {
  const { _splat } = Route.useParams();
  return <>{resolvePage(_splat ?? "")}</>;
}

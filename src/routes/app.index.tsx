import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/lib/passenger-pages";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

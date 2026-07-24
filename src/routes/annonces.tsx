import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/annonces")({
  component: AnnoncesLayout,
});

function AnnoncesLayout() {
  return <Outlet />;
}

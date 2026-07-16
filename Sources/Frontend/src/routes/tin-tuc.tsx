import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/tin-tuc")({
  component: () => <Outlet />,
});

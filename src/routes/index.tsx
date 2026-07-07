import { createFileRoute } from "@tanstack/react-router";
import App from "@/YenApp";

export const Route = createFileRoute("/")({
  component: App,
});

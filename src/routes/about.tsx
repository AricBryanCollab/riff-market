import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Learn what is RiffMarket and how to join </div>;
}

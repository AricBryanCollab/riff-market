import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/guide")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Website Guidelines</div>;
}

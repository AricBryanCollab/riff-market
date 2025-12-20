import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/community")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>The Riff Market community, check who have joined this marketplace</div>
	);
}

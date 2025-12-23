import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SectionContainer>
			<h1>User Settings Page</h1>
		</SectionContainer>
	);
}

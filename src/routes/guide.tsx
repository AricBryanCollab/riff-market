import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/guide")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SectionContainer>
			<h1>Website Guidelines</h1>
		</SectionContainer>
	);
}

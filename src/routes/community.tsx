import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/community")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SectionContainer>
			<h1>The Riff Market community, check who have joined this marketplace</h1>
		</SectionContainer>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/product/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SectionContainer>
			<h1>Add Products Here</h1>
		</SectionContainer>
	);
}

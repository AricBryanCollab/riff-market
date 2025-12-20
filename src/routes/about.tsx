import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/about")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SectionContainer>
			<h1>Learn what is RiffMarket and how to join </h1>
		</SectionContainer>
	);
}

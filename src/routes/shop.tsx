import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/shop")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SectionContainer>
			<h1>Hello! Shop here at RiffMarket</h1>
		</SectionContainer>
	);
}

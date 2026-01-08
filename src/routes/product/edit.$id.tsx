import { createFileRoute, useParams } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/product/edit/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/product/$id" });

	return (
		<SectionContainer>
			<h1>Edit Product {id} Here</h1>
		</SectionContainer>
	);
}

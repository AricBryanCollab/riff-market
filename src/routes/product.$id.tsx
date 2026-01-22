import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/product/$id")({
	component: ProductDetailComponent,
});

function ProductDetailComponent() {
	const { id } = Route.useParams();

	return (
		<SectionContainer>
			<h1>Product {id}</h1>
		</SectionContainer>
	);
}

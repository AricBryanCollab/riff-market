import { createFileRoute, useParams } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/_shop/shop/product/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/_shop/shop/product/$id" });

	return (
		<SectionContainer>
			<div className="">
				<h1>Initialize dynamic product page</h1>
				<p>Test: {id}</p>
			</div>
		</SectionContainer>
	);
}

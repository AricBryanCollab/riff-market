import { createFileRoute, useParams } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/product/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/product/$id" });

	return (
		<SectionContainer>
			<div className="border border-teal-500 px-2 py-3">
				<h1 className="font-semibold">Initialize dynamic product page</h1>
				<p>Test Product ID: {id}</p>
			</div>
		</SectionContainer>
	);
}

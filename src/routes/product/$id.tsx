import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import Button from "@/components/button";
import SectionContainer from "@/components/sectioncontainer";
export const Route = createFileRoute("/product/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/product/$id" });
	const navigate = useNavigate();

	return (
		<SectionContainer>
			<div className="border border-teal-500 px-2 py-3">
				<h1 className="font-semibold">Initialize dynamic product page</h1>
				<p>Test Product ID: {id}</p>

				<p>Test Edit here:</p>
				<Button
					variant="primary"
					action={() => navigate({ to: `/product/edit/${id}` })}
				>
					Edit my product here
				</Button>
			</div>
		</SectionContainer>
	);
}

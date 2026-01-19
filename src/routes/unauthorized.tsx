import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Button from "@/components/button";
export const Route = createFileRoute("/unauthorized")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col gap-6 min-h-screen justify-center items-center">
			<div className="text-center">
				<h1 className="mt-4 font-secondary text-4xl font-semibold tracking-wide text-gray-900">
					Access Denied
				</h1>

				<p className="text-lg font-medium text-secondary">
					Unauthorized Access
				</p>

				<p className="p-4 text-secondary leading-relaxed">
					The page you're trying to access is restricted to certain user roles.
					You don't have the necessary permissions to view this content.
				</p>
			</div>
			<Button action={() => navigate({ to: "/" })} variant="outline">
				Home Page
			</Button>
		</div>
	);
}

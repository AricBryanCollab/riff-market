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
				<h1 className="mt-4 text-4xl font-semibold tracking-wide text-gray-900">
					Access Denied
				</h1>

				<p className="text-lg font-medium text-secondary">
					Unauthorized Access
				</p>
				<div className="mt-4 flex flex-col gap-2 w-[80%] md:w-full mx-auto">
					<p className="text-secondary leading-relaxed">
						The page you're trying to access is restricted to certain user roles
					</p>
					<p className="text-secondary leading-relaxed">
						You don't have the necessary permissions to view this content
					</p>
				</div>
			</div>
			<Button action={() => navigate({ to: "/" })} variant="outline">
				Home Page
			</Button>
		</div>
	);
}

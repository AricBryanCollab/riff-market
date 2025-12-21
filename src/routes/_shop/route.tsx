import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shop")({
	component: ShopLayoutComponent,
});

function ShopLayoutComponent() {
	return (
		<div className="flex gap-3">
			<div className="border-2 w-md h-screen">
				<h1>Sidebar Here</h1>
			</div>

			<Outlet />
		</div>
	);
}

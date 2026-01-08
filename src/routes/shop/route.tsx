import { createFileRoute, Outlet } from "@tanstack/react-router";
import ShopSidebar from "@/components/shopsidebar";

export const Route = createFileRoute("/shop")({
	component: ShopLayoutComponent,
});

function ShopLayoutComponent() {
	return (
		<div className="flex min-h-screen w-full bg-slate-100">
			{/* SIDEBAR */}
			<ShopSidebar />
			{/* MAIN CONTENT */}
			<main className="flex-1 overflow-y-auto p-4 md:p-6">
				<Outlet />
			</main>
		</div>
	)
}

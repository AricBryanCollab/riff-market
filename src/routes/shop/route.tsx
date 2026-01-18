import { createFileRoute, Outlet } from "@tanstack/react-router";
import AnimatedLoader from "@/components/animatedloader";
import ShopSidebar from "@/components/shopsidebar";

export const Route = createFileRoute("/shop")({
	pendingComponent: () => (
		<div className="flex justify-center items-center w-full min-h-[50%]">
			<AnimatedLoader text="Gathering available instruments" />
		</div>
	),
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
	);
}

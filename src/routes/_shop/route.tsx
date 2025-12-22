import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSidebarStore } from "@/store/sidebar";

export const Route = createFileRoute("/_shop")({
	component: ShopLayoutComponent,
});

function ShopLayoutComponent() {
	const { isExpanded, toggleSidebar } = useSidebarStore();

	return (
		<div className="flex min-h-screen w-full bg-slate-100">
			{/* SIDEBAR */}
			<aside
				className={`
				shrink-0 border-r bg-white p-4
				overflow-hidden fixed z-100 h-screen
				transition-[width] duration-300 ease-in-out
				${isExpanded ? "w-72" : "w-0"}
			`}
			>
				<div className="space-y-6">
					<div className="h-10 w-32 rounded bg-slate-200" />
					<button
						type="button"
						className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer"
						onClick={toggleSidebar}
					>
						Test Toggle
					</button>
					{/* FILTER GROUPS */}
					<div className="space-y-4">
						<div className="h-6 w-24 rounded bg-slate-300" />
						<div className="space-y-2">
							<div className="h-4 rounded bg-slate-200" />
							<div className="h-4 rounded bg-slate-200" />
							<div className="h-4 rounded bg-slate-200" />
						</div>
					</div>

					<div className="space-y-4">
						<div className="h-6 w-24 rounded bg-slate-300" />
						<div className="space-y-2">
							<div className="h-4 rounded bg-slate-200" />
							<div className="h-4 rounded bg-slate-200" />
						</div>
					</div>
				</div>
			</aside>

			{/* MAIN CONTENT */}
			<main className="flex-1 overflow-y-auto p-4 md:p-6">
				<Outlet />
			</main>
		</div>
	);
}

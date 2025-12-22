import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shop")({
	component: ShopLayoutComponent,
});

function ShopLayoutComponent() {
	return (
		<div className="flex min-h-screen w-full bg-slate-50">
			{/* SIDEBAR */}
			<aside className="hidden w-72 shrink-0 border-r bg-white p-4 md:block">
				<div className="space-y-6">
					<div className="h-10 w-32 rounded bg-slate-200" />

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

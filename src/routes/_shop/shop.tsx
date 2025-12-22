import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_shop/shop")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex w-full flex-col gap-6">
			{/* PAGE HEADER */}
			<div className="flex flex-col gap-4 rounded-xl bg-white p-4 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="h-6 w-40 rounded bg-slate-300" />
					<div className="mt-2 h-4 w-64 rounded bg-slate-200" />
				</div>

				<div className="flex gap-2">
					<div className="h-10 w-32 rounded bg-slate-200" />
					<div className="h-10 w-32 rounded bg-slate-200" />
				</div>
			</div>

			{/* ACTIVE FILTERS */}
			<div className="flex flex-wrap gap-2">
				<div className="h-8 w-24 rounded-full bg-indigo-100" />
				<div className="h-8 w-28 rounded-full bg-indigo-100" />
				<div className="h-8 w-20 rounded-full bg-indigo-100" />
			</div>

			{/* PRODUCT GRID */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: just a placeholder
						key={i}
						className="flex flex-col rounded-xl bg-white p-4 shadow-sm"
					>
						<div className="mb-4 h-40 rounded-lg bg-slate-200" />
						<div className="h-4 w-3/4 rounded bg-slate-300" />
						<div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
						<div className="mt-4 h-6 w-24 rounded bg-emerald-200" />
					</div>
				))}
			</div>

			{/* PAGINATION / LOAD MORE */}
			<div className="flex justify-center py-6">
				<div className="h-10 w-40 rounded-full bg-slate-300" />
			</div>
		</div>
	);
}

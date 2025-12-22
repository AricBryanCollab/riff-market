import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/reviews/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			{/* HERO / OVERVIEW */}
			<SectionContainer>
				<div className="flex min-h-[35vh] w-full flex-col items-center justify-center rounded-2xl bg-slate-900 p-8 text-center text-white">
					<h1 className="text-4xl font-bold">
						Trusted Reviews from Real Musicians
					</h1>
					<p className="mt-4 max-w-xl opacity-90">
						See what the community says about guitars, pedals, and gear.
					</p>
				</div>
			</SectionContainer>

			{/* MARKETPLACE RATING */}
			<SectionContainer>
				<div className="min-h-[25vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-4 text-2xl font-semibold">
						RiffMarket by the Numbers
					</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="h-24 rounded-xl bg-emerald-100" />
						<div className="h-24 rounded-xl bg-emerald-100" />
						<div className="h-24 rounded-xl bg-emerald-100" />
					</div>
				</div>
			</SectionContainer>

			{/* FILTERS */}
			<SectionContainer>
				<div className="flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-6">
					<div className="h-10 w-32 rounded-full bg-slate-200" />
					<div className="h-10 w-32 rounded-full bg-slate-200" />
					<div className="h-10 w-32 rounded-full bg-slate-200" />
					<div className="h-10 w-32 rounded-full bg-slate-200" />
				</div>
			</SectionContainer>

			{/* REVIEWED PRODUCTS */}
			<SectionContainer>
				<div className="min-h-[50vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">Products with Reviews</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: just a placeholder
								key={i}
								className="rounded-xl bg-slate-100 p-4"
							>
								<div className="mb-3 h-32 rounded-lg bg-slate-300" />
								<div className="h-4 w-3/4 rounded bg-slate-400" />
								<div className="mt-2 h-4 w-1/2 rounded bg-slate-300" />
								<div className="mt-4 h-6 w-24 rounded bg-amber-200" />
							</div>
						))}
					</div>
				</div>
			</SectionContainer>

			{/* WHY REVIEWS MATTER */}
			<SectionContainer>
				<div className="min-h-[30vh] w-full rounded-2xl bg-indigo-50 p-8">
					<h2 className="mb-4 text-2xl font-semibold">Why Reviews Matter</h2>
					<div className="space-y-3">
						<div className="h-4 w-full rounded bg-indigo-200" />
						<div className="h-4 w-11/12 rounded bg-indigo-200" />
						<div className="h-4 w-10/12 rounded bg-indigo-200" />
					</div>
				</div>
			</SectionContainer>
		</>
	);
}
